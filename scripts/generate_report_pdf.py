from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Preformatted, SimpleDocTemplate, Spacer


root = Path(__file__).resolve().parents[1]
source = root / "docs" / "NutriWarrior_Backend_Sprint_Report.md"
target = root / "docs" / "NutriWarrior_Backend_Sprint_Report.pdf"
font_path = Path("C:/Windows/Fonts/arial.ttf")
font_bold_path = Path("C:/Windows/Fonts/arialbd.ttf")

if font_path.exists() and font_bold_path.exists():
    pdfmetrics.registerFont(TTFont("ReportArial", str(font_path)))
    pdfmetrics.registerFont(TTFont("ReportArial-Bold", str(font_bold_path)))
    body_font = "ReportArial"
    bold_font = "ReportArial-Bold"
else:
    body_font = "Helvetica"
    bold_font = "Helvetica-Bold"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="ReportTitle", parent=styles["Title"], fontName=bold_font,
    fontSize=20, leading=24, alignment=TA_CENTER, spaceAfter=14))
styles.add(ParagraphStyle(
    name="ReportHeading", parent=styles["Heading2"], fontName=bold_font,
    fontSize=13, leading=16, spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(
    name="ReportBody", parent=styles["BodyText"], fontName=body_font,
    fontSize=9.5, leading=13, spaceAfter=6))
styles.add(ParagraphStyle(
    name="ReportCode", parent=styles["Code"], fontName="Courier",
    fontSize=8, leading=10, leftIndent=8, spaceAfter=6))

story = []
in_code = False
code_lines = []

for raw_line in source.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if line == "```":
        if in_code:
            story.append(Preformatted("\n".join(code_lines), styles["ReportCode"]))
            code_lines = []
        in_code = not in_code
        continue
    if in_code:
        code_lines.append(raw_line)
        continue
    if not line:
        story.append(Spacer(1, 2))
    elif line.startswith("# "):
        story.append(Paragraph(escape(line[2:]), styles["ReportTitle"]))
    elif line.startswith("## "):
        story.append(Paragraph(escape(line[3:]), styles["ReportHeading"]))
    elif line.startswith("- "):
        story.append(Paragraph("&#8226; " + escape(line[2:]), styles["ReportBody"]))
    else:
        story.append(Paragraph(escape(line).replace("`", ""), styles["ReportBody"]))

document = SimpleDocTemplate(
    str(target), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
    topMargin=16 * mm, bottomMargin=16 * mm,
    title="NutriWarrior Backend Sprint Report")
document.build(story)
print(target)