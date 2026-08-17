from django.conf import settings
from rest_framework import serializers
from capteurs.models import Capteur, Mesure
from alertes.models import ZoneRisque, Alerte, PredictionIA, EpisodeInondation

def wkt_to_geojson(wkt_str):
    if not isinstance(wkt_str, str):
        return None
    wkt_str = wkt_str.strip().upper()
    if wkt_str.startswith("POINT"):
        inner = wkt_str[len("POINT"):].strip()
        inner = inner.lstrip("(").rstrip(")")
        parts = inner.split()
        if len(parts) >= 2:
            return {
                "type": "Point",
                "coordinates": [float(parts[0]), float(parts[1])]
            }
    elif wkt_str.startswith("MULTIPOLYGON"):
        inner = wkt_str[len("MULTIPOLYGON"):].strip()
        if inner.startswith("(") and inner.endswith(")"):
            inner = inner[1:-1].strip()
            polygons = []
            depth = 0
            current = []
            for char in inner:
                if char == '(':
                    depth += 1
                elif char == ')':
                    depth -= 1
                current.append(char)
                if depth == 0 and char == ',':
                    poly_strs = "".join(current[:-1]).strip()
                    if poly_strs.startswith(","):
                        poly_strs = poly_strs.lstrip(",").strip()
                    polygons.append(poly_strs)
                    current = []
            if current:
                poly_strs = "".join(current).strip()
                if poly_strs.startswith(","):
                    poly_strs = poly_strs.lstrip(",").strip()
                polygons.append(poly_strs)
            
            poly_coords_list = []
            for poly_str in polygons:
                poly_str = poly_str.strip()
                if poly_str.startswith(","):
                    poly_str = poly_str.lstrip(",").strip()
                poly_coords = parse_polygon_coords(poly_str)
                if poly_coords:
                    poly_coords_list.append(poly_coords)
            return {
                "type": "MultiPolygon",
                "coordinates": poly_coords_list
            }
    elif wkt_str.startswith("POLYGON"):
        inner = wkt_str[len("POLYGON"):].strip()
        coords = parse_polygon_coords(inner)
        if coords:
            return {
                "type": "Polygon",
                "coordinates": coords
            }
    return None

def parse_polygon_coords(poly_str):
    poly_str = poly_str.strip()
    if poly_str.startswith("(") and poly_str.endswith(")"):
        poly_str = poly_str[1:-1].strip()
        rings = []
        depth = 0
        current = []
        for char in poly_str:
            if char == '(':
                depth += 1
            elif char == ')':
                depth -= 1
            current.append(char)
            if depth == 0 and char == ',':
                rings.append("".join(current[:-1]).strip())
                current = []
        if current:
            rings.append("".join(current).strip())
            
        ring_list = []
        for ring in rings:
            ring = ring.strip()
            if ring.startswith(","):
                ring = ring.lstrip(",").strip()
            ring = ring.lstrip("(").rstrip(")")
            points = []
            for pt in ring.split(","):
                pt = pt.strip()
                if pt:
                    parts = pt.split()
                    if len(parts) >= 2:
                        points.append([float(parts[0]), float(parts[1])])
            if points:
                ring_list.append(points)
        return ring_list
    return None

def geojson_to_wkt(geom):
    if not isinstance(geom, dict):
        return None
    g_type = geom.get('type')
    coords = geom.get('coordinates')
    if not g_type or coords is None:
        return None
        
    g_type = g_type.upper()
    if g_type == 'POINT':
        if len(coords) >= 2:
            return f"POINT({coords[0]} {coords[1]})"
    elif g_type == 'POLYGON':
        rings = []
        for ring in coords:
            pts = ", ".join(f"{pt[0]} {pt[1]}" for pt in ring)
            rings.append(f"({pts})")
        return f"POLYGON({', '.join(rings)})"
    elif g_type == 'MULTIPOLYGON':
        polys = []
        for poly in coords:
            rings = []
            for ring in poly:
                pts = ", ".join(f"{pt[0]} {pt[1]}" for pt in ring)
                rings.append(f"({pts})")
            polys.append(f"({', '.join(rings)})")
        return f"MULTIPOLYGON({', '.join(polys)})"
    return None


if getattr(settings, 'USE_GIS', False):
    from rest_framework_gis.serializers import GeoFeatureModelSerializer

    class HybridGeoFeatureModelSerializer(GeoFeatureModelSerializer):
        pass
else:
    from rest_framework.utils.serializer_helpers import ReturnDict

    class HybridGeoFeatureListSerializer(serializers.ListSerializer):
        @property
        def data(self):
            ret = super(serializers.ListSerializer, self).data
            return ReturnDict(ret, serializer=self)

        def to_representation(self, data):
            iterable = data.all() if hasattr(data, 'all') else data
            return {
                "type": "FeatureCollection",
                "features": [
                    self.child.to_representation(item) for item in iterable
                ]
            }

    class HybridGeoFeatureModelSerializer(serializers.ModelSerializer):
        """
        A fallback model serializer that outputs the exact same GeoJSON format
        as GeoFeatureModelSerializer for Point/Polygon/MultiPolygon geometry when USE_GIS=False.
        """
        @classmethod
        def many_init(cls, *args, **kwargs):
            child_serializer = cls(*args, **kwargs)
            list_kwargs = {'child': child_serializer}
            list_kwargs.update({
                key: value for key, value in kwargs.items()
                if key in serializers.LIST_SERIALIZER_KWARGS
            })
            meta = getattr(cls, 'Meta', None)
            list_serializer_class = getattr(meta, 'list_serializer_class', HybridGeoFeatureListSerializer)
            return list_serializer_class(*args, **list_kwargs)

        def to_representation(self, instance):
            ret = super().to_representation(instance)
            geo_field = getattr(self.Meta, 'geo_field', None)
            
            # Remove the geo_field from properties
            if geo_field:
                ret.pop(geo_field, None)
                
            geometry = None
            if geo_field:
                val = getattr(instance, geo_field, None)
                if val:
                    if isinstance(val, str):
                        geometry = wkt_to_geojson(val)
                    elif hasattr(val, 'geom_type') and hasattr(val, 'coords'):
                        geometry = {
                            "type": val.geom_type,
                            "coordinates": list(val.coords) if val.geom_type == 'Point' else val.coords
                        }
                    elif hasattr(val, 'coords'):
                        geometry = {
                            "type": "Point",
                            "coordinates": list(val.coords)
                        }

            # Reconstruct the GeoJSON structure
            properties = {k: v for k, v in ret.items() if k != 'id'}
            return {
                "id": instance.id,
                "type": "Feature",
                "geometry": geometry,
                "properties": properties
            }

        def to_internal_value(self, data):
            geo_field = getattr(self.Meta, 'geo_field', None)
            internal_data = {}

            # If input data is in GeoJSON format
            if isinstance(data, dict) and ('properties' in data or 'geometry' in data):
                properties = data.get('properties', {})
                geometry = data.get('geometry', {})
                
                internal_data.update(properties)
                
                if geometry and geo_field:
                    wkt = geojson_to_wkt(geometry)
                    if wkt:
                        internal_data[geo_field] = wkt
            else:
                # If input is flat
                internal_data.update(data)
                if geo_field and geo_field in internal_data:
                    val = internal_data[geo_field]
                    if isinstance(val, dict):
                        wkt = geojson_to_wkt(val)
                        if wkt:
                            internal_data[geo_field] = wkt
                    elif isinstance(val, list):
                        wkt = geojson_to_wkt({"type": "Point", "coordinates": val})
                        if wkt:
                            internal_data[geo_field] = wkt

            return super().to_internal_value(internal_data)


class CapteurSerializer(HybridGeoFeatureModelSerializer):
    class Meta:
        model = Capteur
        geo_field = 'localisation'
        fields = ('id', 'nom', 'type', 'actif', 'date_installation', 'localisation')


class MesureSerializer(serializers.ModelSerializer):
    capteur = serializers.PrimaryKeyRelatedField(queryset=Capteur.objects.all())

    class Meta:
        model = Mesure
        fields = ('id', 'capteur', 'valeur', 'unite', 'timestamp')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Nest the Capteur's GeoJSON representation in the output
        ret['capteur'] = CapteurSerializer(instance.capteur).data
        return ret


class ZoneRisqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZoneRisque
        fields = ('id', 'quartier', 'niveau_risque')


class ZoneRisqueGeoSerializer(HybridGeoFeatureModelSerializer):
    class Meta:
        model = ZoneRisque
        geo_field = 'geom'
        fields = ('id', 'quartier', 'niveau_risque', 'geom')


class PredictionIASerializer(serializers.ModelSerializer):
    zone = ZoneRisqueSerializer(read_only=True)

    class Meta:
        model = PredictionIA
        fields = ('id', 'zone', 'probabilite', 'horizon_h', 'confiance', 'timestamp')


class EpisodeInondationSerializer(HybridGeoFeatureModelSerializer):
    class Meta:
        model = EpisodeInondation
        geo_field = 'geom'
        fields = ('id', 'date_debut', 'date_fin', 'surface_ha', 'geom')


class AlerteSerializer(serializers.ModelSerializer):
    zone = serializers.PrimaryKeyRelatedField(queryset=ZoneRisque.objects.all())

    class Meta:
        model = Alerte
        fields = ('id', 'niveau', 'zone', 'timestamp', 'canaux', 'statut')

    def validate_niveau(self, value):
        valid_niveaux = ['vert', 'jaune', 'orange', 'rouge']
        if value not in valid_niveaux:
            raise serializers.ValidationError(
                f"Le niveau doit être l'un des suivants : {', '.join(valid_niveaux)}."
            )
        return value

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['zone'] = ZoneRisqueSerializer(instance.zone).data
        return ret
