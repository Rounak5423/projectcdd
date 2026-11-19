"""
End-to-End Test Suite for CIVORA Research Intelligence.
Verifies experiment lifecycle, simulation fidelity, analytics computation,
and PDF / DOCX scientific manuscript generation.
"""

import os
import sys
import unittest

# Ensure backend path is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "genesis-engine", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from engine.research.policy_experiment import (
    PolicyExperimentConfig,
    PolicyInterventionParams,
    get_default_initial_state,
    create_standard_scenarios,
    save_experiment_record,
    load_experiment_record,
    list_experiment_records
)
from engine.research.civilisation_simulator import MultiYearCivilisationSimulator
from engine.research.research_analytics import ResearchAnalyticsEngine
from engine.research.paper_generator import ResearchPaperGenerator
from engine.research.research_export import ResearchExportService


class TestResearchIntelligence(unittest.TestCase):

    def setUp(self):
        self.simulator = MultiYearCivilisationSimulator()
        self.analytics_engine = ResearchAnalyticsEngine()
        self.paper_generator = ResearchPaperGenerator()
        self.export_service = ResearchExportService()

    def test_complete_research_lifecycle(self):
        exp_id = "test_exp_healthcare_2026"
        init_state = get_default_initial_state(2026)
        interv = PolicyInterventionParams(
            tax_rate=0.20,
            healthcare_budget_pct=0.35,
            education_budget_pct=0.25,
            infrastructure_investment_pct=0.20,
            universal_basic_income=True,
            cognitive_scaffolding=True,
            green_energy_subsidy=True,
            tech_research_subsidy=True,
            custom_slider_value=80.0
        )
        scenarios = create_standard_scenarios(
            policy_category="Healthcare",
            policy_name="National Clinical Triage & Preventative Medicine Protocol",
            primary_intervention=interv
        )

        config = PolicyExperimentConfig(
            experiment_id=exp_id,
            title="Longitudinal Evaluation of Clinical Triage & Preventative Medicine",
            policy_category="Healthcare",
            policy_name="National Clinical Triage & Preventative Medicine Protocol",
            research_question="How does targeted healthcare expansion alter civil vitality and fiscal sustainability over 10 years?",
            hypothesis="Expanding public clinical triage will curb mortality rates without exhausting sovereign treasury reserves.",
            starting_year=2026,
            simulation_duration=10,
            initial_state=init_state,
            scenarios=scenarios,
            status="configured"
        )

        # 1. Run Multi-Year Simulation
        sim_res = self.simulator.run_experiment(config)
        self.assertEqual(sim_res["experiment_id"], exp_id)
        self.assertEqual(len(sim_res["scenarios"]), 5)
        for sc_id in ["baseline", "scenario_a", "scenario_b", "scenario_c", "stress_shock"]:
            self.assertIn(sc_id, sim_res["scenarios"])
            # Duration 10 means 11 snapshots (Year 0 to 10)
            self.assertEqual(len(sim_res["scenarios"][sc_id]), 11)

        # Verify physical realism
        sc_a_last = sim_res["scenarios"]["scenario_a"][-1]
        self.assertGreater(sc_a_last.population, 100000)
        self.assertGreater(sc_a_last.gdp, 1000000)
        self.assertTrue(0.18 <= sc_a_last.gini_index <= 0.65)
        self.assertTrue(0.0 <= sc_a_last.wellbeing <= 1.0)

        # 2. Run Analytics & Chart Generation
        out_dir = os.path.join(BACKEND_DIR, "data", "test_research_output")
        os.makedirs(out_dir, exist_ok=True)
        analytics = self.analytics_engine.analyze_experiment(
            experiment_id=exp_id,
            scenarios_results=sim_res["scenarios"],
            figures_output_dir=out_dir
        )
        self.assertIn("scenario_summaries", analytics)
        self.assertIn("counterfactual_gains", analytics)
        self.assertIn("statistical_evaluation", analytics)
        self.assertIn("charts", analytics)
        for chart_key in ["trajectories", "counterfactual_deltas", "uncertainty_bands", "sensitivity_elasticity", "radar"]:
            self.assertIn(chart_key, analytics["charts"])
            self.assertTrue(os.path.exists(analytics["charts"][chart_key]))

        # 3. Generate 26-Section Manuscript
        manuscript = self.paper_generator.generate_manuscript(
            config=config,
            scenarios_results=sim_res["scenarios"],
            analytics=analytics
        )
        self.assertIn("title", manuscript)
        self.assertIn("abstract", manuscript)
        self.assertIn("references", manuscript)
        self.assertGreaterEqual(len(manuscript["references"]), 10)

        # 4. Export PDF
        pdf_path = os.path.join(out_dir, f"{exp_id}_paper.pdf")
        self.export_service.export_pdf(
            config=config,
            manuscript=manuscript,
            analytics=analytics,
            output_filepath=pdf_path
        )
        self.assertTrue(os.path.exists(pdf_path))
        pdf_sz = os.path.getsize(pdf_path)
        self.assertGreater(pdf_sz, 50000)  # > 50KB

        # 5. Export DOCX
        docx_path = os.path.join(out_dir, f"{exp_id}_paper.docx")
        self.export_service.export_docx(
            config=config,
            manuscript=manuscript,
            analytics=analytics,
            output_filepath=docx_path
        )
        self.assertTrue(os.path.exists(docx_path))
        docx_sz = os.path.getsize(docx_path)
        self.assertGreater(docx_sz, 20000)  # > 20KB

        print(f"PASS: Research Intelligence E2E Test completed successfully!")
        print(f"Generated PDF: {pdf_path} ({pdf_sz/1024:.1f} KB)")
        print(f"Generated DOCX: {docx_path} ({docx_sz/1024:.1f} KB)")


if __name__ == "__main__":
    unittest.main()

