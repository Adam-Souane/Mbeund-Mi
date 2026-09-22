"""
Service pour exporter les données en PDF avec logo et charte graphique.
Utilise reportlab pour générer des rapports professionnels.
"""
import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

from alertes.models import Alerte, SignalementCitoyen, ZoneRisque

# Couleurs de la charte graphique Mbeund-Mi
COLORS = {
    'navy': colors.HexColor('#1B2A40'),
    'navy_light': colors.HexColor('#4A6480'),
    'red': colors.HexColor('#C0182A'),
    'teal': colors.HexColor('#0D9488'),
    'white': colors.white,
    'light_bg': colors.HexColor('#E8EFF5'),
}


class PDFExportService:
    """Service d'export PDF avec charte graphique et logo."""

    # Chemin du logo relatif au settings.BASE_DIR
    LOGO_PATH = 'dist/assets/logo-CNlNnHlF.jpg'
    PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)

    @staticmethod
    def _get_logo_path():
        """Récupère le chemin complet du logo."""
        from django.conf import settings
        logo_path = os.path.join(settings.BASE_DIR, '..', PDFExportService.LOGO_PATH)
        if os.path.exists(logo_path):
            return logo_path
        return None

    @staticmethod
    def _get_header():
        """Crée l'en-tête du rapport avec logo agrandi et sous-titre."""
        elements = []

        logo_path = PDFExportService._get_logo_path()

        if logo_path:
            # Logo agrandi comme en-tête principal
            logo = Image(logo_path, width=5*cm, height=2*cm)
            elements.append(logo)

        # Sous-titre centré
        subtitle = Paragraph(
            '<font size=11 color="#4A6480"><b>Prévention des Inondations • Thiaroye-sur-Mer</b></font>',
            ParagraphStyle('SubtitleStyle', fontSize=11, textColor=COLORS['navy_light'], alignment=TA_CENTER)
        )
        elements.append(subtitle)
        elements.append(Spacer(1, 0.8*cm))

        return elements

    @staticmethod
    def _get_footer(title):
        """Crée le pied de page avec titre du rapport."""
        line = Table([['_' * 100]], colWidths=[PDFExportService.PAGE_WIDTH - 2*cm])
        line.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TEXTCOLOR', (0, 0), (-1, -1), COLORS['navy_light']),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))

        footer_text = Paragraph(
            f'<font size=9 color="#4A6480"><b>{title}</b> • {datetime.now().strftime("%d/%m/%Y à %H:%M")}</font>',
            ParagraphStyle('FooterStyle', fontSize=9, textColor=COLORS['navy_light'], alignment=TA_CENTER)
        )

        return [Spacer(1, 1*cm), line, Spacer(1, 0.3*cm), footer_text]

    @staticmethod
    def _generer_table_alertes(alertes):
        """Crée une table pour les alertes."""
        data = [['ID', 'Quartier', 'Niveau', 'Statut', 'Date', 'Message']]

        # Couleurs de risque
        level_colors = {
            'vert': colors.HexColor('#3C9A5F'),
            'jaune': colors.HexColor('#F59E0B'),
            'orange': colors.HexColor('#E0792E'),
            'rouge': colors.HexColor('#C0182A'),
        }

        for alerte in alertes[:50]:  # Limiter à 50 pour lisibilité
            niveau = alerte.get_niveau_display()
            data.append([
                str(alerte.id),
                alerte.zone.quartier if alerte.zone else '—',
                niveau,
                alerte.get_statut_display(),
                alerte.timestamp.strftime('%d/%m/%Y') if alerte.timestamp else '—',
                (alerte.message[:30] + '...') if alerte.message else '—',
            ])

        # Créer la table
        col_widths = [1.2*cm, 2.5*cm, 1.5*cm, 2*cm, 2*cm, 10*cm]
        table = Table(data, colWidths=col_widths)

        # Style de la table
        table.setStyle(TableStyle([
            # En-tête
            ('BACKGROUND', (0, 0), (-1, 0), COLORS['navy']),
            ('TEXTCOLOR', (0, 0), (-1, 0), COLORS['white']),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
            # Données
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLORS['white'], COLORS['light_bg']]),
            ('GRID', (0, 0), (-1, -1), 0.5, COLORS['navy_light']),
        ]))

        return table

    @staticmethod
    def generer_pdf_alertes():
        """
        Génère un PDF des alertes avec charte graphique.

        Returns:
            (BytesIO PDF, nom_fichier)
        """
        alertes = Alerte.objects.select_related('zone').order_by('-timestamp')[:100]

        output = io.BytesIO()
        doc = SimpleDocTemplate(
            output,
            pagesize=landscape(A4),
            rightMargin=1*cm,
            leftMargin=1*cm,
            topMargin=1*cm,
            bottomMargin=1*cm,
        )

        # Construire le contenu
        elements = []

        # En-tête
        elements.extend(PDFExportService._get_header())

        # Titre du rapport
        title_style = ParagraphStyle(
            'ReportTitle',
            fontSize=16,
            textColor=COLORS['navy'],
            fontName='Helvetica-Bold',
            spaceAfter=12,
        )
        elements.append(Paragraph('Rapport des Alertes', title_style))

        # Statistiques rapides (avant le slicing)
        total = len(alertes)
        critiques = sum(1 for a in alertes if a.niveau == 'rouge')

        stats_text = Paragraph(
            f'<font size=10 color="#1B2A40"><b>Total d\'alertes:</b> {total} • '
            f'<b style="color:#C0182A">Alertes critiques:</b> {critiques}</font>',
            ParagraphStyle('StatsStyle', fontSize=10, textColor=COLORS['navy'], spaceAfter=12)
        )
        elements.append(stats_text)
        elements.append(Spacer(1, 0.3*cm))

        # Table des alertes
        if alertes:
            elements.append(PDFExportService._generer_table_alertes(alertes))
        else:
            elements.append(Paragraph('<font size=10 color="#4A6480">Aucune alerte enregistrée.</font>',
                                    ParagraphStyle('NoDataStyle', fontSize=10)))

        # Pied de page
        elements.extend(PDFExportService._get_footer('Rapport des Alertes'))

        # Générer le PDF
        doc.build(elements)

        output.seek(0)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"rapport_alertes_{timestamp}.pdf"

        return output, filename

    @staticmethod
    def generer_pdf_signalements():
        """
        Génère un PDF des signalements citoyens avec charte graphique.

        Returns:
            (BytesIO PDF, nom_fichier)
        """
        queryset = SignalementCitoyen.objects.select_related('signale_par').order_by('-date_creation')

        # Récupérer les stats avant le slice
        total = queryset.count()
        valides = queryset.filter(valide=True).count()

        # Ensuite faire le slice pour récupérer les 100 premiers
        signalements = queryset[:100]

        output = io.BytesIO()
        doc = SimpleDocTemplate(
            output,
            pagesize=landscape(A4),
            rightMargin=1*cm,
            leftMargin=1*cm,
            topMargin=1*cm,
            bottomMargin=1*cm,
        )

        # Construire le contenu
        elements = []

        # En-tête
        elements.extend(PDFExportService._get_header())

        # Titre du rapport
        title_style = ParagraphStyle(
            'ReportTitle',
            fontSize=16,
            textColor=COLORS['navy'],
            fontName='Helvetica-Bold',
            spaceAfter=12,
        )
        elements.append(Paragraph('Rapport des Signalements Citoyens', title_style))

        # Statistiques
        # (déjà calculées avant le slice)

        stats_text = Paragraph(
            f'<font size=10 color="#1B2A40"><b>Total signalements:</b> {total} • '
            f'<b style="color:#0D9488">Signalements validés:</b> {valides}</font>',
            ParagraphStyle('StatsStyle', fontSize=10, textColor=COLORS['navy'], spaceAfter=12)
        )
        elements.append(stats_text)
        elements.append(Spacer(1, 0.3*cm))

        # Table des signalements
        data = [['ID', 'Catégorie', 'Niveau Eau', 'Valide', 'Auteur', 'Date']]

        for sig in signalements[:50]:
            data.append([
                str(sig.id),
                sig.get_categorie_display(),
                sig.get_niveau_eau_estime_display(),
                'Oui' if sig.valide else 'Non',
                sig.signale_par.username if sig.signale_par else 'Anonyme',
                sig.date_creation.strftime('%d/%m/%Y') if sig.date_creation else '—',
            ])

        col_widths = [1.2*cm, 2.5*cm, 2.5*cm, 1.5*cm, 3*cm, 2*cm]
        table = Table(data, colWidths=col_widths)

        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLORS['navy']),
            ('TEXTCOLOR', (0, 0), (-1, 0), COLORS['white']),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLORS['white'], COLORS['light_bg']]),
            ('GRID', (0, 0), (-1, -1), 0.5, COLORS['navy_light']),
        ]))

        if signalements:
            elements.append(table)
        else:
            elements.append(Paragraph('<font size=10 color="#4A6480">Aucun signalement enregistré.</font>',
                                    ParagraphStyle('NoDataStyle', fontSize=10)))

        # Pied de page
        elements.extend(PDFExportService._get_footer('Rapport des Signalements Citoyens'))

        # Générer le PDF
        doc.build(elements)

        output.seek(0)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"rapport_signalements_{timestamp}.pdf"

        return output, filename
