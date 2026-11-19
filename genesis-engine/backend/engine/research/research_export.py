"""
Research Export Service: Generates publication-grade scientific PDF and editable DOCX manuscripts.
"""

import os
import sys
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from .policy_experiment import PolicyExperimentConfig


class AcademicNumberedCanvas(canvas.Canvas):
    """Dynamic two-pass canvas for running header and page numbering."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4B5563"))

        # Running Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 752, "CIVORA RESEARCH INTELLIGENCE  |  COMPUTATIONAL SOCIAL SCIENCE MONOGRAPH")
            self.drawRightString(612 - 54, 752, "ISSN 2834-9182  •  PEER REVIEW AUDIT")
            self.setStrokeColor(colors.HexColor("#C5A66A"))
            self.setLineWidth(0.7)
            self.line(54, 746, 612 - 54, 746)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#C5A66A"))
        self.setLineWidth(0.7)
        self.line(54, 46, 612 - 54, 46)

        self.drawString(54, 34, "CIVORA ARTIFICIAL CIVILISATION EXPERIMENTS  •  REPRODUCIBLE COMPUTATIONAL RESEARCH")
        self.drawRightString(612 - 54, 34, f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()


class ResearchExportService:
    """Exports research manuscripts to PDF and DOCX formats."""

    def export_pdf(
        self,
        config: PolicyExperimentConfig,
        manuscript: Dict[str, Any],
        analytics: Dict[str, Any],
        output_filepath: str
    ) -> str:
        os.makedirs(os.path.dirname(output_filepath), exist_ok=True)

        doc = SimpleDocTemplate(
            output_filepath,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()
        c_primary = colors.HexColor('#141B16')
        c_gold = colors.HexColor('#9E7C38')
        c_slate = colors.HexColor('#334155')
        c_light = colors.HexColor('#F8FAF7')

        title_style = ParagraphStyle(
            'PaperTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=c_primary,
            alignment=1,
            spaceAfter=6
        )

        author_style = ParagraphStyle(
            'AuthorBlock',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#4B5563'),
            alignment=1,
            spaceAfter=14
        )

        abstract_title_style = ParagraphStyle(
            'AbstractTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=13,
            textColor=c_primary,
            spaceAfter=3
        )

        abstract_body_style = ParagraphStyle(
            'AbstractBody',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=12,
            textColor=c_slate
        )

        sec_heading_style = ParagraphStyle(
            'SectionH1',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            textColor=c_primary,
            spaceBefore=10,
            spaceAfter=4
        )

        subsec_heading_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=13,
            textColor=c_gold,
            spaceBefore=8,
            spaceAfter=3
        )

        body_style = ParagraphStyle(
            'PaperBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12.5,
            textColor=c_slate,
            spaceAfter=6
        )

        bullet_style = ParagraphStyle(
            'PaperBullet',
            parent=body_style,
            leftIndent=12,
            firstLineIndent=-8,
            spaceAfter=3
        )

        caption_style = ParagraphStyle(
            'FigCaption',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor('#4B5563'),
            alignment=1,
            spaceBefore=3,
            spaceAfter=8
        )

        story = []

        # Title & Author Header
        story.append(Paragraph(manuscript["title"], title_style))
        story.append(Paragraph(
            f"<b>Civora Imperial Research Intelligence & Autonomous Policy Observatory</b><br/>"
            f"Department of Computational Social Science & Multi-Agent Simulation Systems<br/>"
            f"Published: Simulated Civilisation Epoch {config.starting_year}–{config.starting_year + config.simulation_duration} • Experiment ID: <code>{config.experiment_id}</code>",
            author_style
        ))
        story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceAfter=8))

        # Abstract Box
        abstract_box_data = [
            [
                Paragraph("<b>ABSTRACT</b>", abstract_title_style),
            ],
            [
                Paragraph(manuscript["abstract"], abstract_body_style),
            ],
            [
                Paragraph(f"<b>Keywords:</b> {', '.join(manuscript['keywords'])}", ParagraphStyle('KW', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=c_primary)),
            ]
        ]
        abstract_table = Table(abstract_box_data, colWidths=[504])
        abstract_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F4F6F4')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#C5A66A')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(abstract_table)
        story.append(Spacer(1, 10))

        # Sections 1 to 5
        story.append(Paragraph("1. Introduction", sec_heading_style))
        story.append(Paragraph(manuscript["introduction"].replace('\n\n', '<br/><br/>'), body_style))

        story.append(Paragraph("2. Research Problem & Theoretical Motivation", sec_heading_style))
        story.append(Paragraph(manuscript["research_problem"], body_style))

        story.append(Paragraph("3. Research Objectives", sec_heading_style))
        for obj in manuscript["objectives"]:
            story.append(Paragraph(obj, bullet_style))

        story.append(Paragraph("4. Literature Review", sec_heading_style))
        story.append(Paragraph(manuscript["literature_review"].replace('\n\n', '<br/><br/>'), body_style))

        story.append(Paragraph("5. Dataset Description & Empirical Baselines", sec_heading_style))
        story.append(Paragraph(manuscript["dataset_description"], body_style))
        story.append(Paragraph(manuscript["preprocessing"], body_style))

        # Machine Learning Architecture
        story.append(Paragraph("6. Machine Learning Model Architecture", sec_heading_style))
        story.append(Paragraph(manuscript["model_architecture"].replace('\n\n', '<br/><br/>'), body_style))

        # Experimental Methodology & Policy Design
        story.append(Paragraph("7. Experimental Methodology & Counterfactual Design", sec_heading_style))
        story.append(Paragraph(manuscript["methodology"], body_style))
        story.append(Paragraph(manuscript["policy_design"].replace('\n', '<br/>'), body_style))
        story.append(Paragraph(manuscript["simulation_framework"], body_style))

        # TABLE 1: Quantitative Results Across Scenarios
        story.append(Spacer(1, 6))
        story.append(Paragraph("<b>Table 1:</b> Final Multi-Year Civilisational Outcomes Across Controlled Scenarios", caption_style))

        summaries = analytics.get("scenario_summaries", {})
        t1_header = [
            Paragraph("Scenario Name", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("Population", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("Gross Product (CRC)", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("Gini Index", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("Wellbeing", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("Approval", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white))
        ]
        t1_rows = [t1_header]
        for sc_id, s in summaries.items():
            t1_rows.append([
                Paragraph(f"<b>{sc_id.replace('_', ' ').title()}</b>", ParagraphStyle('TCB', fontName='Helvetica-Bold', fontSize=7.5)),
                Paragraph(f"{s.get('population_final', 0):,.0f}", ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5)),
                Paragraph(f"{s.get('gdp_final', 0):,.2f}", ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5)),
                Paragraph(f"{s.get('gini_final', 0):.4f}", ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5)),
                Paragraph(f"{s.get('wellbeing_final', 0):.4f}", ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5)),
                Paragraph(f"{s.get('citizen_approval_final', 0):.1f}%", ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5)),
            ])
        t1 = Table(t1_rows, colWidths=[114, 75, 115, 65, 65, 70])
        t1.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), c_primary),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LINEBELOW', (0, 0), (-1, 0), 1.5, c_gold),
        ]))
        story.append(t1)
        story.append(Spacer(1, 8))

        # Insert Figure 1 & Figure 2
        charts = analytics.get("charts", {})
        if "trajectories" in charts and os.path.exists(charts["trajectories"]):
            story.append(Image(charts["trajectories"], width=500, height=300))
            story.append(Paragraph("<b>Figure 1:</b> Longitudinal Simulation Trajectories Across 5 Scenarios (Population, GDP, Gini, Wellbeing)", caption_style))
            story.append(Spacer(1, 6))

        # Results & Year-wise Analysis
        story.append(Paragraph("8. Results & Longitudinal Findings", sec_heading_style))
        story.append(Paragraph(manuscript["results_findings"], body_style))
        story.append(Paragraph(manuscript["year_analysis"].replace('\n\n', '<br/><br/>'), body_style))

        if "counterfactual_deltas" in charts and os.path.exists(charts["counterfactual_deltas"]):
            story.append(Image(charts["counterfactual_deltas"], width=460, height=250))
            story.append(Paragraph("<b>Figure 2:</b> Counterfactual Net Percentage Differences Over Status-Quo Baseline", caption_style))
            story.append(Spacer(1, 6))

        # Comparative & Statistical Analysis
        story.append(Paragraph("9. Comparative Policy Analysis", sec_heading_style))
        story.append(Paragraph(manuscript["comparative_analysis"].replace('\n\n', '<br/><br/>'), body_style))

        story.append(Paragraph("10. Statistical Evaluation & Hypothesis Testing", sec_heading_style))
        story.append(Paragraph(manuscript["stat_text"].replace('\n', '<br/>'), body_style))

        # TABLE 2: Welch's t-test Table
        stat_eval = analytics.get("statistical_evaluation", {})
        t2_header = [
            Paragraph("Metric Variable", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("t-Statistic", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("p-Value", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("Statistical Significance", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("Cohen's d Effect Size", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white))
        ]
        t2_rows = [t2_header]
        for m, r in stat_eval.items():
            t2_rows.append([
                Paragraph(f"<b>{m.replace('_', ' ').title()}</b>", ParagraphStyle('TCB', fontName='Helvetica-Bold', fontSize=7.5)),
                Paragraph(f"{r.get('t_statistic', 0):.4f}", ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5)),
                Paragraph(f"{r.get('p_value', 0):.6f}", ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5)),
                Paragraph("Significant (p < 0.05)" if r.get('statistically_significant') else "Not Significant", ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5)),
                Paragraph(f"{r.get('cohens_d_effect_size', 0):.3f} ({r.get('effect_magnitude', 'N/A')})", ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5)),
            ])
        t2 = Table(t2_rows, colWidths=[120, 80, 80, 114, 110])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), c_primary),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LINEBELOW', (0, 0), (-1, 0), 1.5, c_gold),
        ]))
        story.append(t2)
        story.append(Spacer(1, 8))

        # Sensitivity & Figure 3/4
        story.append(Paragraph("11. Sensitivity, Robustness & Uncertainty Bounds", sec_heading_style))
        story.append(Paragraph(manuscript["robustness"], body_style))

        if "uncertainty_bands" in charts and os.path.exists(charts["uncertainty_bands"]):
            story.append(Image(charts["uncertainty_bands"], width=460, height=250))
            story.append(Paragraph("<b>Figure 3:</b> 90% Empirical Credible Interval Envelope [p10, p90] Over Simulation Horizon", caption_style))
            story.append(Spacer(1, 6))

        if "sensitivity_elasticity" in charts and os.path.exists(charts["sensitivity_elasticity"]):
            story.append(Image(charts["sensitivity_elasticity"], width=460, height=230))
            story.append(Paragraph("<b>Figure 4:</b> Outcome Sensitivity Elasticity to Institutional Parameter Shifts", caption_style))
            story.append(Spacer(1, 6))

        if "radar" in charts and os.path.exists(charts["radar"]):
            story.append(Image(charts["radar"], width=360, height=295))
            story.append(Paragraph("<b>Figure 5:</b> Holistic Multi-Domain Civilisational Balance Radar at Horizon End", caption_style))
            story.append(Spacer(1, 6))

        # Discussion, Contributions, Limitations, Ethics, Conclusion
        story.append(Paragraph("12. Discussion: Causal Generative Mechanics vs Correlation", sec_heading_style))
        story.append(Paragraph(manuscript["discussion"], body_style))

        story.append(Paragraph("13. Systemic Unintended Consequences", sec_heading_style))
        consequences = analytics.get("unintended_consequences", [])
        for c in consequences:
            story.append(Paragraph(f"• {c}", bullet_style))

        story.append(Paragraph("14. Research Contributions", sec_heading_style))
        for rc in manuscript["contributions"]:
            story.append(Paragraph(rc, bullet_style))

        story.append(Paragraph("15. Methodological Limitations & Model Assumptions", sec_heading_style))
        story.append(Paragraph(manuscript["limitations"], body_style))

        story.append(Paragraph("16. Ethical Governance Guardrails", sec_heading_style))
        story.append(Paragraph(manuscript["ethics"], body_style))

        story.append(Paragraph("17. Conclusion & Executive Governance Summary", sec_heading_style))
        story.append(Paragraph(manuscript["conclusion"], body_style))

        story.append(Paragraph("18. Future Research Directions", sec_heading_style))
        for fr in manuscript["future_research"]:
            story.append(Paragraph(fr, bullet_style))

        story.append(Paragraph("19. References", sec_heading_style))
        for ref in manuscript["references"]:
            story.append(Paragraph(ref, ParagraphStyle('Ref', fontName='Helvetica', fontSize=7.5, leading=10.5, leftIndent=12, firstLineIndent=-12, spaceAfter=4)))

        story.append(Paragraph("20. Appendices", sec_heading_style))
        story.append(Paragraph(manuscript["appendix"].replace('\n\n', '<br/><br/>').replace('\n', '<br/>'), ParagraphStyle('App', fontName='Courier', fontSize=7.5, leading=10.5, textColor=colors.HexColor('#222'))))

        # Build Document
        doc.build(story, canvasmaker=AcademicNumberedCanvas)
        return output_filepath

    def export_docx(
        self,
        config: PolicyExperimentConfig,
        manuscript: Dict[str, Any],
        analytics: Dict[str, Any],
        output_filepath: str
    ) -> str:
        os.makedirs(os.path.dirname(output_filepath), exist_ok=True)

        doc = docx.Document()

        # Set standard academic 1-inch margins
        for section in doc.sections:
            section.top_margin = Inches(1)
            section.bottom_margin = Inches(1)
            section.left_margin = Inches(1)
            section.right_margin = Inches(1)

        # Title
        p_title = doc.add_paragraph()
        run_title = p_title.add_run(manuscript["title"])
        run_title.font.name = "Calibri"
        run_title.font.size = Pt(20)
        run_title.font.bold = True
        run_title.font.color.rgb = RGBColor(20, 27, 22)
        p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER

        # Subtitle / Authors
        p_sub = doc.add_paragraph()
        run_sub = p_sub.add_run(
            f"Civora Imperial Research Intelligence & Autonomous Policy Observatory\n"
            f"Department of Computational Social Science & Multi-Agent Simulation Systems\n"
            f"Experiment ID: {config.experiment_id} | Starting Year: {config.starting_year} | Duration: {config.simulation_duration} Years"
        )
        run_sub.font.name = "Calibri"
        run_sub.font.size = Pt(10)
        run_sub.font.italic = True
        run_sub.font.color.rgb = RGBColor(100, 116, 139)
        p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER

        doc.add_paragraph()

        # Abstract Box
        tbl_abstract = doc.add_table(rows=1, cols=1)
        tbl_abstract.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell_abs = tbl_abstract.cell(0, 0)
        p_abs_title = cell_abs.paragraphs[0]
        r_abs_t = p_abs_title.add_run("ABSTRACT\n")
        r_abs_t.font.bold = True
        r_abs_t.font.size = Pt(10.5)
        r_abs = p_abs_title.add_run(manuscript["abstract"] + "\n\n")
        r_abs.font.size = Pt(9.5)
        r_abs.font.italic = True
        r_kw = p_abs_title.add_run(f"Keywords: {', '.join(manuscript['keywords'])}")
        r_kw.font.size = Pt(9)
        r_kw.font.bold = True

        doc.add_paragraph()

        # Sections
        sections_data = [
            ("1. Introduction", manuscript["introduction"]),
            ("2. Research Problem & Theoretical Motivation", manuscript["research_problem"]),
            ("3. Research Objectives", "\n".join(manuscript["objectives"])),
            ("4. Literature Review", manuscript["literature_review"]),
            ("5. Dataset Description & Preprocessing", f"{manuscript['dataset_description']}\n\n{manuscript['preprocessing']}"),
            ("6. Machine Learning Model Architecture", manuscript["model_architecture"]),
            ("7. Experimental Methodology & Policy Design", f"{manuscript['methodology']}\n\n{manuscript['policy_design']}\n\n{manuscript['simulation_framework']}"),
            ("8. Results & Longitudinal Findings", f"{manuscript['results_findings']}\n\n{manuscript['year_analysis']}"),
            ("9. Comparative Policy Analysis", manuscript["comparative_analysis"]),
            ("10. Statistical Evaluation & Significance Testing", manuscript["stat_text"]),
            ("11. Sensitivity, Robustness & Uncertainty Bounds", manuscript["robustness"]),
            ("12. Discussion: Causal Generative Mechanics vs Correlation", manuscript["discussion"]),
            ("13. Systemic Unintended Consequences", "\n".join([f"• {c}" for c in analytics.get("unintended_consequences", [])])),
            ("14. Research Contributions", "\n".join(manuscript["contributions"])),
            ("15. Methodological Limitations & Model Assumptions", manuscript["limitations"]),
            ("16. Ethical Governance Guardrails", manuscript["ethics"]),
            ("17. Conclusion & Executive Governance Summary", manuscript["conclusion"]),
            ("18. Future Research Directions", "\n".join(manuscript["future_research"])),
            ("19. References", "\n\n".join(manuscript["references"])),
            ("20. Appendices", manuscript["appendix"]),
        ]

        charts = analytics.get("charts", {})

        for heading, text in sections_data:
            h = doc.add_heading(heading, level=1)
            h.style.font.color.rgb = RGBColor(20, 27, 22)

            for paragraph_block in text.split("\n\n"):
                p = doc.add_paragraph(paragraph_block)
                p.style.font.name = "Calibri"
                p.style.font.size = Pt(10)

            # Insert Figures where appropriate
            if heading.startswith("8. Results") and "trajectories" in charts and os.path.exists(charts["trajectories"]):
                doc.add_picture(charts["trajectories"], width=Inches(6.2))
                cap = doc.add_paragraph("Figure 1: Longitudinal Simulation Trajectories Across 5 Scenarios.")
                cap.style.font.size = Pt(8.5)
                cap.style.font.italic = True
                cap.alignment = WD_ALIGN_PARAGRAPH.CENTER

            if heading.startswith("9. Comparative") and "counterfactual_deltas" in charts and os.path.exists(charts["counterfactual_deltas"]):
                doc.add_picture(charts["counterfactual_deltas"], width=Inches(6.0))
                cap = doc.add_paragraph("Figure 2: Counterfactual Net Percentage Differences Over Status-Quo Baseline.")
                cap.style.font.size = Pt(8.5)
                cap.style.font.italic = True
                cap.alignment = WD_ALIGN_PARAGRAPH.CENTER

            if heading.startswith("11. Sensitivity") and "uncertainty_bands" in charts and os.path.exists(charts["uncertainty_bands"]):
                doc.add_picture(charts["uncertainty_bands"], width=Inches(6.0))
                cap = doc.add_paragraph("Figure 3: 90% Empirical Credible Interval Envelope [p10, p90].")
                cap.style.font.size = Pt(8.5)
                cap.style.font.italic = True
                cap.alignment = WD_ALIGN_PARAGRAPH.CENTER

        doc.save(output_filepath)
        return output_filepath

