from __future__ import annotations

import json
import shutil
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "lib" / "cv-data.json"
OUTPUT_DIR = ROOT / "output" / "pdf"
PUBLIC_DIR = ROOT / "public"

INK = colors.HexColor("#182016")
TEXT = colors.HexColor("#465041")
MUTED = colors.HexColor("#687263")
GREEN = colors.HexColor("#426C2B")
LIME = colors.HexColor("#91BE70")
PALE = colors.HexColor("#EEF5E9")
LINE = colors.HexColor("#DCE5D7")


def load_data() -> dict:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def link(label: str, href: str | None) -> str:
    safe_label = escape(label)
    if not href:
        return safe_label
    return f'<link href="{escape(href)}" color="#426C2B">{safe_label}</link>'


def section_heading(title: str, styles: dict) -> list:
    heading = Table(
        [[Paragraph(escape(title.upper()), styles["section"]), ""]],
        colWidths=[48 * mm, None],
        hAlign="LEFT",
    )
    heading.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LINEBELOW", (1, 0), (1, 0), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return [Spacer(1, 5.2 * mm), heading, Spacer(1, 2.2 * mm)]


def build_styles() -> dict:
    sample = getSampleStyleSheet()
    return {
        "name": ParagraphStyle(
            "Name",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=27,
            textColor=INK,
            spaceAfter=2,
        ),
        "title": ParagraphStyle(
            "Title",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=GREEN,
        ),
        "known": ParagraphStyle(
            "Known",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=7.8,
            leading=10,
            textColor=MUTED,
        ),
        "brand": ParagraphStyle(
            "Brand",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.2,
            leading=9,
            textColor=GREEN,
            alignment=TA_RIGHT,
        ),
        "contact": ParagraphStyle(
            "Contact",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=8.2,
            leading=11,
            textColor=TEXT,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.2,
            leading=10,
            textColor=GREEN,
            tracking=1.2,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=9.1,
            leading=12.5,
            textColor=TEXT,
        ),
        "skill_label": ParagraphStyle(
            "SkillLabel",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.2,
            leading=10.8,
            textColor=INK,
        ),
        "skill_text": ParagraphStyle(
            "SkillText",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=8.1,
            leading=10.8,
            textColor=TEXT,
        ),
        "role": ParagraphStyle(
            "Role",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.4,
            leading=12,
            textColor=INK,
        ),
        "duration": ParagraphStyle(
            "Duration",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.3,
            leading=9,
            textColor=GREEN,
            alignment=TA_RIGHT,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=8.4,
            leading=11.5,
            textColor=TEXT,
            leftIndent=8,
            firstLineIndent=-5,
            bulletIndent=0,
            spaceAfter=1.5,
        ),
        "project_name": ParagraphStyle(
            "ProjectName",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.4,
            leading=11.5,
            textColor=INK,
        ),
        "project_type": ParagraphStyle(
            "ProjectType",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.2,
            leading=9,
            textColor=MUTED,
        ),
        "project_url": ParagraphStyle(
            "ProjectUrl",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.2,
            leading=9,
            textColor=GREEN,
            alignment=TA_RIGHT,
        ),
        "project_body": ParagraphStyle(
            "ProjectBody",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=8.2,
            leading=11,
            textColor=TEXT,
        ),
        "tech": ParagraphStyle(
            "Tech",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.2,
            leading=9,
            textColor=MUTED,
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=7,
            leading=9,
            textColor=MUTED,
        ),
        "footer_brand": ParagraphStyle(
            "FooterBrand",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=9,
            textColor=GREEN,
            alignment=TA_RIGHT,
        ),
    }


def page_metadata(canvas, doc, data: dict) -> None:
    canvas.saveState()
    canvas.setTitle(f"{data['identity']['fullName']} - {data['identity']['title']} CV")
    canvas.setAuthor(data["identity"]["fullName"])
    canvas.setSubject("Professional full-stack web developer CV")
    canvas.setKeywords("full-stack web developer, Next.js, TypeScript, Node.js, PostgreSQL")
    canvas.restoreState()


def build_pdf(data: dict, destination: Path) -> None:
    styles = build_styles()
    destination.parent.mkdir(parents=True, exist_ok=True)

    doc = BaseDocTemplate(
        str(destination),
        pagesize=A4,
        leftMargin=13 * mm,
        rightMargin=13 * mm,
        topMargin=13 * mm,
        bottomMargin=11 * mm,
        title=f"{data['identity']['fullName']} - {data['identity']['title']} CV",
        author=data["identity"]["fullName"],
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc.addPageTemplates(
        [
            PageTemplate(
                id="cv",
                frames=[frame],
                onPage=lambda canvas, current_doc: page_metadata(canvas, current_doc, data),
            )
        ]
    )

    story = []
    identity = data["identity"]
    contact = data["contact"]

    header_left = [
        Paragraph(escape(identity["fullName"].upper()), styles["name"]),
        Paragraph(escape(identity["title"]), styles["title"]),
        Paragraph(f"Known professionally as {escape(identity['knownAs'])}", styles["known"]),
    ]
    header_right = [
        Paragraph(escape(identity["brand"].upper()), styles["brand"]),
        Spacer(1, 3),
        Table(
            [[Paragraph("FULL-STACK / WEB", styles["brand"])]],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), PALE),
                    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            ),
            hAlign="RIGHT",
        ),
    ]
    header = Table(
        [[header_left, header_right]],
        colWidths=[doc.width * 0.73, doc.width * 0.27],
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.extend([header, Spacer(1, 2.5 * mm)])

    contact_parts = [
        link(contact["portfolioLabel"], contact["portfolioUrl"]),
        link(contact["phoneLabel"], contact["phoneUrl"]),
        escape(contact["location"]),
    ]
    if contact.get("email"):
        contact_parts.insert(1, link(contact["email"], f"mailto:{contact['email']}"))
    if contact.get("linkedinLabel") and contact.get("linkedinUrl"):
        contact_parts.append(link(contact["linkedinLabel"], contact["linkedinUrl"]))
    if contact.get("githubLabel") and contact.get("githubUrl"):
        contact_parts.append(link(contact["githubLabel"], contact["githubUrl"]))
    story.extend(
        [
            Paragraph(" &nbsp; | &nbsp; ".join(contact_parts), styles["contact"]),
            Spacer(1, 2.3 * mm),
            HRFlowable(width="100%", thickness=0.8, color=LIME),
        ]
    )

    story.extend(section_heading("Profile", styles))
    story.append(Paragraph(escape(data["summary"]), styles["body"]))

    highlight_cells = []
    for item in data["highlights"]:
        highlight_cells.append(
            [
                Paragraph(
                    f'<font color="#315A1F"><b>{escape(item["value"])}</b></font>',
                    styles["role"],
                ),
                Paragraph(escape(item["label"].upper()), styles["known"]),
            ]
        )
    highlight_table = Table(
        [highlight_cells],
        colWidths=[doc.width / len(highlight_cells)] * len(highlight_cells),
    )
    highlight_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([Spacer(1, 2.6 * mm), highlight_table])

    story.extend(section_heading("Technical Skills", styles))
    skill_rows = []
    for group in data["skills"]:
        skill_rows.append(
            [
                Paragraph(escape(group["category"]), styles["skill_label"]),
                Paragraph(escape(" / ".join(group["items"])), styles["skill_text"]),
            ]
        )
    skills_table = Table(skill_rows, colWidths=[31 * mm, doc.width - 31 * mm])
    skills_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(skills_table)

    background = data["developmentBackground"]
    story.extend(section_heading("Development Experience", styles))
    background_header = Table(
        [
            [
                Paragraph(escape(background["title"]), styles["role"]),
                Paragraph(escape(background["duration"]), styles["duration"]),
            ]
        ],
        colWidths=[doc.width * 0.8, doc.width * 0.2],
    )
    background_header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "BASELINE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    background_block = [background_header]
    for bullet in background["bullets"]:
        background_block.append(
            Paragraph(escape(bullet), styles["bullet"], bulletText="-")
        )
    story.append(KeepTogether(background_block))

    story.extend(section_heading("Selected Projects", styles))
    for index, project in enumerate(data["projects"]):
        project_header = Table(
            [
                [
                    Paragraph(escape(project["name"]), styles["project_name"]),
                    Paragraph(escape(project["type"]), styles["project_type"]),
                    Paragraph(link(project["urlLabel"], project["url"]), styles["project_url"]),
                ]
            ],
            colWidths=[35 * mm, 82 * mm, doc.width - 117 * mm],
        )
        project_header.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "BASELINE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ]
            )
        )
        project_block = Table(
            [
                [
                    "",
                    [
                        project_header,
                        Paragraph(escape(project["description"]), styles["project_body"]),
                        Paragraph(escape(" / ".join(project["technologies"])), styles["tech"]),
                    ],
                ]
            ],
            colWidths=[2.2 * mm, doc.width - 2.2 * mm],
        )
        project_block.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, 0), LIME),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (0, 0), 0),
                    ("RIGHTPADDING", (0, 0), (0, 0), 0),
                    ("LEFTPADDING", (1, 0), (1, 0), 7),
                    ("RIGHTPADDING", (1, 0), (1, 0), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(KeepTogether([project_block]))
        if index < len(data["projects"]) - 1:
            story.append(Spacer(1, 2.2 * mm))

    if data.get("education"):
        story.extend(section_heading("Education", styles))
        for entry in data["education"]:
            story.append(Paragraph(escape(entry), styles["body"]))

    story.extend(
        [
            Spacer(1, 3.2 * mm),
            HRFlowable(width="100%", thickness=0.6, color=LINE),
            Spacer(1, 1.5 * mm),
        ]
    )
    footer = Table(
        [
            [
                Paragraph(
                    f"<b>Languages:</b> {escape(' / '.join(data['languages']))}",
                    styles["footer"],
                ),
                Paragraph(escape(identity["brand"]), styles["footer_brand"]),
            ]
        ],
        colWidths=[doc.width * 0.7, doc.width * 0.3],
    )
    footer.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(footer)

    doc.build(story)


def main() -> None:
    data = load_data()
    output_path = OUTPUT_DIR / data["downloadFileName"]
    public_path = PUBLIC_DIR / data["downloadFileName"]
    build_pdf(data, output_path)
    shutil.copyfile(output_path, public_path)
    print(f"Generated {output_path}")
    print(f"Published {public_path}")


if __name__ == "__main__":
    main()
