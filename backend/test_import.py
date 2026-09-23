#!/usr/bin/env python
import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
mbeund_mi_ia_path = os.path.join(project_root, 'mbeund_mi_ia')
print(f'Adding to sys.path: {mbeund_mi_ia_path}')
print(f'Path exists: {os.path.exists(mbeund_mi_ia_path)}')
sys.path.insert(0, mbeund_mi_ia_path)

try:
    from ia.service_prediction import PredictionService
    print('SUCCESS: PredictionService imported')
except Exception as e:
    print(f'ERROR: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
