#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings.dev')
sys.path.insert(0, os.path.dirname(__file__))

django.setup()

try:
    from api.services.pdf_export_service import PDFExportService
    print("[OK] PDF Service imported successfully")

    # Test PDF generation for alertes
    output, filename = PDFExportService.generer_pdf_alertes()
    print("[OK] Alertes PDF generated: " + filename)

    # Test PDF generation for signalements
    output2, filename2 = PDFExportService.generer_pdf_signalements()
    print("[OK] Signalements PDF generated: " + filename2)
except Exception as e:
    print("[ERROR] " + str(e))
    import traceback
    traceback.print_exc()
