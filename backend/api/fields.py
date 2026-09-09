from django.conf import settings
from django.db import models

if getattr(settings, 'USE_GIS', False):
    from django.contrib.gis.db.models import PointField as GISPointField
    from django.contrib.gis.db.models import PolygonField as GISPolygonField
    from django.contrib.gis.db.models import MultiPolygonField as GISMultiPolygonField

    class SpatialPointField(GISPointField):
        pass

    class SpatialPolygonField(GISPolygonField):
        pass

    class SpatialMultiPolygonField(GISMultiPolygonField):
        pass

else:
    class SpatialPointField(models.CharField):
        def __init__(self, *args, **kwargs):
            self.srid = kwargs.pop('srid', 4326)
            self.spatial_index = kwargs.pop('spatial_index', True)
            if 'max_length' not in kwargs:
                kwargs['max_length'] = 255
            super().__init__(*args, **kwargs)

        def deconstruct(self):
            name, path, args, kwargs = super().deconstruct()
            kwargs['srid'] = self.srid
            kwargs['spatial_index'] = self.spatial_index
            return name, path, args, kwargs

    class SpatialPolygonField(models.TextField):
        def __init__(self, *args, **kwargs):
            self.srid = kwargs.pop('srid', 4326)
            self.spatial_index = kwargs.pop('spatial_index', True)
            super().__init__(*args, **kwargs)

        def deconstruct(self):
            name, path, args, kwargs = super().deconstruct()
            kwargs['srid'] = self.srid
            kwargs['spatial_index'] = self.spatial_index
            return name, path, args, kwargs

    class SpatialMultiPolygonField(models.TextField):
        def __init__(self, *args, **kwargs):
            self.srid = kwargs.pop('srid', 4326)
            self.spatial_index = kwargs.pop('spatial_index', True)
            super().__init__(*args, **kwargs)

        def deconstruct(self):
            name, path, args, kwargs = super().deconstruct()
            kwargs['srid'] = self.srid
            kwargs['spatial_index'] = self.spatial_index
            return name, path, args, kwargs
