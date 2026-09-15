"""
Itinéraire d'évacuation sûr.

Construit un graphe non orienté à partir des `SegmentRue` (chaque extrémité
de segment devient un nœud, chaque segment une arête) puis calcule, via
Dijkstra (networkx), le chemin le moins coûteux depuis la position d'un
citoyen jusqu'au point du réseau connu le plus proche d'une zone à faible
risque — le coût d'une arête pénalise fortement les tronçons dangereux
(`score_risque_actuel`), si bien qu'un détour plus long mais plus sûr est
préféré à la ligne droite quand une alternative existe.
"""
import math
import networkx as nx
from django.conf import settings

from alertes.models import SegmentRue, ZoneRisque

NIVEAU_RANK = {'vert': 0, 'jaune': 1, 'orange': 2, 'rouge': 3}

# Au-delà de cette distance, la position de départ est considérée trop
# éloignée du réseau de rues connu pour qu'un itinéraire soit fiable.
MAX_DISTANCE_RESEAU_KM = 2.0

# Un tronçon au score de risque maximum (1.0) coûte 6x sa longueur réelle —
# assez pour qu'un détour raisonnable soit toujours préféré à la traversée
# d'une zone dangereuse, sans pour autant permettre des détours absurdes.
PENALITE_RISQUE = 5


def _haversine_km(lon1, lat1, lon2, lat2):
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _node_key(lon, lat, precision=5):
    # ~1m de précision à cette latitude : assez pour fusionner les
    # extrémités de segments qui se touchent, sans fusionner des points
    # distincts entre eux.
    return (round(lon, precision), round(lat, precision))


def _segment_coords(segment):
    geom = segment.geom
    if settings.USE_GIS:
        return list(geom.coords)
    # Repli SQLite : geom est une chaîne WKT "LINESTRING(lon lat, lon lat, ...)".
    inner = geom.strip()
    inner = inner[inner.index('(') + 1: inner.rindex(')')]
    coords = []
    for pair in inner.split(','):
        lon_str, lat_str = pair.strip().split()
        coords.append((float(lon_str), float(lat_str)))
    return coords


def build_graph():
    """Retourne (graphe, node_zone_ids) — node_zone_ids associe chaque
    nœud aux zones des segments qui y aboutissent."""
    graph = nx.Graph()
    node_zone_ids = {}

    for segment in SegmentRue.objects.all():
        coords = _segment_coords(segment)
        risk = float(segment.score_risque_actuel or 0)

        for (lon1, lat1), (lon2, lat2) in zip(coords, coords[1:]):
            n1, n2 = _node_key(lon1, lat1), _node_key(lon2, lat2)
            length_km = _haversine_km(lon1, lat1, lon2, lat2)
            weight = length_km * (1 + risk * PENALITE_RISQUE)

            graph.add_node(n1, lon=lon1, lat=lat1)
            graph.add_node(n2, lon=lon2, lat=lat2)
            graph.add_edge(
                n1, n2,
                weight=weight,
                length_km=length_km,
                risk=risk,
                segment_id=segment.id,
                segment_nom=segment.nom,
            )

            if segment.zone_id:
                node_zone_ids.setdefault(n1, set()).add(segment.zone_id)
                node_zone_ids.setdefault(n2, set()).add(segment.zone_id)

    return graph, node_zone_ids


def _nearest_node(graph, lon, lat):
    best_node, best_dist = None, None
    for node, data in graph.nodes(data=True):
        dist = _haversine_km(lon, lat, data['lon'], data['lat'])
        if best_dist is None or dist < best_dist:
            best_node, best_dist = node, dist
    return best_node, best_dist


def find_safe_route(lat, lon):
    """
    Retourne un dict décrivant l'itinéraire le plus sûr depuis (lat, lon),
    ou None si aucun itinéraire n'a pu être calculé (pas de segments en
    base, ou position trop isolée du réseau connu).
    """
    graph, node_zone_ids = build_graph()
    if graph.number_of_nodes() == 0:
        return None

    start_node, start_dist_km = _nearest_node(graph, lon, lat)
    if start_node is None or start_dist_km > MAX_DISTANCE_RESEAU_KM:
        return None

    distances, paths = nx.single_source_dijkstra(graph, start_node, weight='weight')

    zones_by_id = {z.id: z for z in ZoneRisque.objects.all()}

    def zone_rank(zone):
        return (NIVEAU_RANK.get(zone.niveau_risque, 0), float(zone.score_risque_moyen or 0))

    best_node, best_zone, best_key = None, None, None
    for node, cost in distances.items():
        if node == start_node:
            continue
        for zone_id in node_zone_ids.get(node, ()):
            zone = zones_by_id.get(zone_id)
            if not zone:
                continue
            key = (zone_rank(zone), cost)
            if best_key is None or key < best_key:
                best_key, best_node, best_zone = key, node, zone

    if best_node is None:
        return None

    path_nodes = paths[best_node]
    coordinates = [[graph.nodes[n]['lon'], graph.nodes[n]['lat']] for n in path_nodes]

    total_length_km = 0.0
    total_risk_weighted = 0.0
    segments_risque_traverses = []
    seen_segment_ids = set()

    for n1, n2 in zip(path_nodes, path_nodes[1:]):
        edge = graph.edges[n1, n2]
        total_length_km += edge['length_km']
        total_risk_weighted += edge['length_km'] * edge['risk']
        if edge['risk'] >= 0.5 and edge['segment_id'] not in seen_segment_ids:
            seen_segment_ids.add(edge['segment_id'])
            segments_risque_traverses.append(edge['segment_nom'] or f"Segment #{edge['segment_id']}")

    score_risque_moyen_parcours = (total_risk_weighted / total_length_km) if total_length_km else 0.0

    return {
        'route': {'type': 'LineString', 'coordinates': coordinates},
        'distance_km': round(total_length_km, 2),
        'zone_arrivee': {
            'id': best_zone.id,
            'quartier': best_zone.quartier,
            'niveau_risque': best_zone.niveau_risque,
        },
        'score_risque_moyen_parcours': round(score_risque_moyen_parcours, 2),
        'segments_risque_traverses': segments_risque_traverses,
        'distance_depart_reseau_km': round(start_dist_km, 3),
    }
