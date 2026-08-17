from django.conf import settings
from rest_framework import serializers
from capteurs.models import Capteur, Mesure
from alertes.models import ZoneRisque, Alerte

if getattr(settings, 'USE_GIS', False):
    from rest_framework_gis.serializers import GeoFeatureModelSerializer

    class HybridGeoFeatureModelSerializer(GeoFeatureModelSerializer):
        pass
else:
    class HybridGeoFeatureModelSerializer(serializers.ModelSerializer):
        """
        A fallback model serializer that outputs the exact same GeoJSON format
        as GeoFeatureModelSerializer for Point geometry when USE_GIS=False.
        """
        def to_representation(self, instance):
            ret = super().to_representation(instance)
            geo_field = getattr(self.Meta, 'geo_field', None)
            
            # Remove the geo_field from properties
            if geo_field:
                ret.pop(geo_field, None)
                
            coords = None
            if geo_field:
                val = getattr(instance, geo_field, None)
                if val:
                    # In CharField mode, value is stored as WKT e.g. "POINT(-17.38 14.75)"
                    if isinstance(val, str) and val.startswith("POINT"):
                        try:
                            # Extract long and lat from POINT(lng lat)
                            coords_str = val.replace("POINT", "").replace("(", "").replace(")", "").strip()
                            parts = coords_str.split()
                            if len(parts) == 2:
                                coords = [float(parts[0]), float(parts[1])]
                        except Exception:
                            pass
                    elif hasattr(val, 'coords'):
                        coords = list(val.coords)
                    elif hasattr(val, 'x') and hasattr(val, 'y'):
                        coords = [val.x, val.y]

            # Reconstruct the GeoJSON structure
            properties = {k: v for k, v in ret.items() if k != 'id'}
            return {
                "id": instance.id,
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": coords
                } if coords else None,
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
                
                if geometry and geometry.get('type') == 'Point':
                    coords = geometry.get('coordinates', [])
                    if len(coords) == 2:
                        internal_data[geo_field] = f"POINT({coords[0]} {coords[1]})"
            else:
                # If input is flat
                internal_data.update(data)
                if geo_field and geo_field in internal_data:
                    val = internal_data[geo_field]
                    if isinstance(val, list) and len(val) == 2:
                        internal_data[geo_field] = f"POINT({val[0]} {val[1]})"

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
