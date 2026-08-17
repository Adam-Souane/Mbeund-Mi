import math
import json
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.conf import settings
from rest_framework import serializers
from capteurs.models import Capteur, Mesure
from alertes.models import ZoneRisque, Alerte, PredictionIA, EpisodeInondation, SignalementCitoyen

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


# Helper functions for geofencing and image compression

def parse_lon_lat(localisation):
    if not localisation:
        return None
    # 1. GEOSGeometry check
    if hasattr(localisation, 'x') and hasattr(localisation, 'y'):
        return float(localisation.x), float(localisation.y)
    if hasattr(localisation, 'coords'):
        return float(localisation.coords[0]), float(localisation.coords[1])
    
    # 2. String check (WKT or similar)
    if isinstance(localisation, str):
        localisation_upper = localisation.strip().upper()
        if localisation_upper.startswith("POINT"):
            inner = localisation_upper[len("POINT"):].strip()
            inner = inner.lstrip("(").rstrip(")")
            parts = inner.split()
            if len(parts) >= 2:
                try:
                    return float(parts[0]), float(parts[1])
                except ValueError:
                    pass
        # Fallback if it's "lon,lat"
        elif "," in localisation:
            try:
                parts = [float(x.strip()) for x in localisation.split(',')]
                if len(parts) >= 2:
                    return parts[0], parts[1]
            except ValueError:
                pass
                
    # 3. List check
    if isinstance(localisation, list) and len(localisation) >= 2:
        try:
            return float(localisation[0]), float(localisation[1])
        except ValueError:
            pass
            
    # 4. Dict check (GeoJSON)
    if isinstance(localisation, dict):
        coords = localisation.get('coordinates')
        if isinstance(coords, list) and len(coords) >= 2:
            try:
                return float(coords[0]), float(coords[1])
            except ValueError:
                pass
                
    return None


def haversine_distance(lon1, lat1, lon2, lat2):
    R = 6371.0  # Earth's radius in km
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0)**2
        
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def compress_image(uploaded_image):
    if not uploaded_image:
        return None
        
    # Open image using Pillow
    img = Image.open(uploaded_image)
    
    # Convert image format/mode to RGB (necessary for JPEG)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        # Create a white background for transparent images
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.convert('RGBA').split()[3]) # 3 is the alpha channel
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
        
    # Resize keeping aspect ratio (max 800x800)
    img.thumbnail((800, 800), Image.Resampling.LANCZOS)
    
    # Save the compressed image back to a memory buffer
    output_io = BytesIO()
    img.save(output_io, format='JPEG', quality=70, optimize=True)
    output_io.seek(0)
    
    # Create a new InMemoryUploadedFile to replace the original
    new_file = InMemoryUploadedFile(
        output_io,
        'FileField',
        f"{uploaded_image.name.split('.')[0]}.jpg",
        'image/jpeg',
        output_io.getbuffer().nbytes,
        None
    )
    return new_file


class SignalementCitoyenSerializer(HybridGeoFeatureModelSerializer):
    class Meta:
        model = SignalementCitoyen
        geo_field = 'localisation'
        fields = ('id', 'localisation', 'description', 'photo', 'valide', 'date_creation', 'categorie')
        read_only_fields = ('id', 'valide', 'date_creation')

    def to_internal_value(self, data):
        # Make a mutable copy of data if it is a QueryDict
        if hasattr(data, 'dict'):
            data = data.dict()
        else:
            data = dict(data)
            
        localisation = data.get('localisation')
        if isinstance(localisation, str):
            localisation = localisation.strip()
            # Try parsing as JSON first (which could be a list or a geojson dict)
            try:
                parsed = json.loads(localisation)
                data['localisation'] = parsed
            except json.JSONDecodeError:
                # If not JSON, check if it's "longitude,latitude"
                if ',' in localisation:
                    try:
                        parts = [float(x.strip()) for x in localisation.split(',')]
                        if len(parts) == 2:
                            data['localisation'] = parts
                    except ValueError:
                        pass
        return super().to_internal_value(data)

    def validate_localisation(self, value):
        coords = parse_lon_lat(value)
        if not coords:
            raise serializers.ValidationError("Format de géolocalisation invalide.")
        
        lon, lat = coords
        # Center of Thiaroye Sur Mer: lat=14.75, lon=-17.38
        dist = haversine_distance(lon, lat, -17.38, 14.75)
        if dist > 4.0:
            raise serializers.ValidationError(
                f"Le signalement doit être à moins de 4 km du centre de Thiaroye Sur Mer. Distance calculée : {dist:.2f} km."
            )
        return value

    def validate_photo(self, value):
        if value:
            # Automatic photo compression
            value = compress_image(value)
        return value

