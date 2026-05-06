from datetime import date
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def gerar_pdf_agenda(medico_nome: str, data: date, consultas: list) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"Agenda do Dr(a). {medico_nome}", styles["Title"]))
    elements.append(Paragraph(f"Data: {data.strftime('%d/%m/%Y')}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    if not consultas:
        elements.append(
            Paragraph("Nenhuma consulta agendada para este dia.", styles["Normal"])
        )
    else:
        dados = [["#", "Horário", "Paciente", "Status"]]
        for c in consultas:
            hora = c["data_hora"][11:16]
            dados.append([
                str(c["consulta_id"]),
                hora,
                c["paciente_nome"],
                c["status"],
            ])

        tabela = Table(dados, colWidths=[40, 80, 260, 100])
        tabela.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(tabela)

    doc.build(elements)
    return buffer.getvalue()