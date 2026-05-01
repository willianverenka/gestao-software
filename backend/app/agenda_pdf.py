from __future__ import annotations

from datetime import date, datetime
from io import BytesIO
from typing import Sequence
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .repositories.consulta_repository import ConsultaAgendaImpressaoRow


def _format_date_br(value: date) -> str:
    return value.strftime("%d/%m/%Y")


def _format_datetime_br(value: datetime) -> str:
    return value.strftime("%d/%m/%Y %H:%M")


def _format_time(value: datetime) -> str:
    return value.strftime("%H:%M")


def build_agenda_pdf(
    *,
    medico_nome: str,
    crm: str | None,
    especialidade: str | None,
    data_agenda: date,
    consultas: Sequence[ConsultaAgendaImpressaoRow],
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.6 * cm,
        rightMargin=1.6 * cm,
        topMargin=1.7 * cm,
        bottomMargin=1.6 * cm,
        title="Agenda do Dia",
        author=medico_nome,
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="AgendaTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#1d4ed8"),
            alignment=TA_LEFT,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="AgendaMeta",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#475569"),
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="AgendaFooter",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#64748b"),
            alignment=TA_LEFT,
        )
    )

    elements = [
        Paragraph("Agenda do Dia", styles["AgendaTitle"]),
        Paragraph(f"<b>Médico:</b> {escape(medico_nome)}", styles["AgendaMeta"]),
        Paragraph(
            f"<b>CRM:</b> {escape(crm or 'CRM não informado')}<br/>"
            f"<b>Especialidade:</b> {escape(especialidade or 'Especialidade não informada')}",
            styles["AgendaMeta"],
        ),
        Paragraph(f"<b>Data:</b> {escape(_format_date_br(data_agenda))}", styles["AgendaMeta"]),
        Spacer(1, 0.4 * cm),
    ]

    table_data = [["Horário", "Paciente", "Convênio"]]
    for consulta in consultas:
        table_data.append(
            [
                _format_time(consulta["data_hora"]),
                consulta["paciente_nome"],
                consulta["convenio_nome"],
            ]
        )

    table = Table(table_data, colWidths=[2.3 * cm, 10.2 * cm, 4.0 * cm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dbeafe")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 9.5),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#f8fafc")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 1), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 7),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 0.45 * cm))
    elements.append(
        Paragraph(
            f"Documento gerado em {_format_datetime_br(datetime.now())}.",
            styles["AgendaFooter"],
        )
    )

    def draw_footer(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#64748b"))
        canvas.setFont("Helvetica", 8.5)
        canvas.drawRightString(
            doc.pagesize[0] - doc.rightMargin,
            1.0 * cm,
            f"Página {canvas.getPageNumber()}",
        )
        canvas.restoreState()

    doc.build(elements, onFirstPage=draw_footer, onLaterPages=draw_footer)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
