"""
FastAPI Research Intelligence Router.
Provides endpoints for creating, simulating, analyzing, and exporting scientific research papers (PDF + DOCX).
"""

import os
import json
import uuid
import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from engine.research.policy_experiment import (
    PolicyExperimentConfig,
    PolicyInterventionParams,
    CivilisationStateVector,
    get_default_initial_state,
    create_standard_scenarios,
    save_experiment_record,
    load_experiment_record,
    list_experiment_records,
    EXPERIMENTS_DATA_DIR
)
from engine.research.civilisation_simulator import MultiYearCivilisationSimulator
from engine.research.research_analytics import ResearchAnalyticsEngine
from engine.research.paper_generator import ResearchPaperGenerator
from engine.research.research_export import ResearchExportService

router = APIRouter(prefix="/research", tags=["Research Intelligence"])

simulator = MultiYearCivilisationSimulator()
analytics_engine = ResearchAnalyticsEngine()
paper_generator = ResearchPaperGenerator()
export_service = ResearchExportService()


class CreateExperimentRequest(BaseModel):
    title: Optional[str] = None
    policy_category: str = Field(default="Healthcare", description="Policy category: Education, Healthcare, Taxation, Infrastructure, Employment, Technology, Resource, Combined")
    policy_name: str = Field(default="Universal Healthcare & Triage Expansion")
    research_question: Optional[str] = None
    hypothesis: Optional[str] = None
    starting_year: int = Field(default=2026, ge=1800, le=2500)
    simulation_duration: int = Field(default=10, ge=3, le=30)
    intervention: Optional[PolicyInterventionParams] = None
    initial_population: Optional[float] = None
    initial_gdp: Optional[float] = None


@router.post("/experiments", status_code=status.HTTP_201_CREATED)
def create_experiment(req: CreateExperimentRequest) -> Dict[str, Any]:
    """Configures a new controlled multi-year policy experiment."""
    exp_id = f"exp_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    
    # Configure baseline initial state
    init_state = get_default_initial_state(starting_year=req.starting_year)
    if req.initial_population is not None:
        init_state.population = float(req.initial_population)
    if req.initial_gdp is not None:
        init_state.gdp = float(req.initial_gdp)

    # Configure intervention parameters
    interv = req.intervention or PolicyInterventionParams(
        tax_rate=0.18,
        healthcare_budget_pct=0.30 if "Health" in req.policy_category else 0.20,
        education_budget_pct=0.30 if "Edu" in req.policy_category else 0.20,
        infrastructure_investment_pct=0.25 if "Infra" in req.policy_category else 0.15,
        universal_basic_income="Social" in req.policy_category or "Welfare" in req.policy_name,
        cognitive_scaffolding="AI" in req.policy_category or "Tech" in req.policy_category,
        green_energy_subsidy="Env" in req.policy_category or "Ecological" in req.policy_name,
        tech_research_subsidy="Research" in req.policy_category or "Tech" in req.policy_category,
        custom_slider_value=75.0
    )

    title = req.title or f"Longitudinal Analysis of {req.policy_name} ({req.starting_year}–{req.starting_year + req.simulation_duration})"
    rq = req.research_question or f"How does enacting {req.policy_name} alter the longitudinal demographic, fiscal, and societal equilibrium of an artificial civilisation?"
    hypo = req.hypothesis or f"Enacting {req.policy_name} under the {req.policy_category} framework will yield statistically significant welfare gains over a {req.simulation_duration}-year horizon without precipitating structural treasury collapse."

    scenarios = create_standard_scenarios(
        policy_category=req.policy_category,
        policy_name=req.policy_name,
        primary_intervention=interv
    )

    config = PolicyExperimentConfig(
        experiment_id=exp_id,
        title=title,
        policy_category=req.policy_category,
        policy_name=req.policy_name,
        research_question=rq,
        hypothesis=hypo,
        starting_year=req.starting_year,
        simulation_duration=req.simulation_duration,
        initial_state=init_state,
        scenarios=scenarios,
        status="configured"
    )

    record = {
        "config": config.model_dump(),
        "created_at": time.time(),
        "status": "configured"
    }
    save_experiment_record(record)

    return {
        "status": "created",
        "experiment_id": exp_id,
        "config": config.model_dump()
    }


@router.get("/experiments")
def list_experiments() -> Dict[str, Any]:
    """Returns a list of all saved research experiments."""
    records = list_experiment_records()
    return {
        "total": len(records),
        "experiments": records
    }


@router.get("/experiments/{experiment_id}")
def get_experiment(experiment_id: str) -> Dict[str, Any]:
    """Retrieves experiment configuration, status, and summary."""
    rec = load_experiment_record(experiment_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return rec


@router.post("/experiments/{experiment_id}/run")
def run_experiment(experiment_id: str) -> Dict[str, Any]:
    """
    Executes the multi-year simulation across all 5 scenarios and computes analytics.
    """
    rec = load_experiment_record(experiment_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    cfg_dict = rec["config"]
    config = PolicyExperimentConfig(**cfg_dict)

    # 1. Execute Multi-Year Simulation
    sim_output = simulator.run_experiment(config)

    # 2. Compute Analytics & Generate Matplotlib Charts
    exp_dir = os.path.join(EXPERIMENTS_DATA_DIR, experiment_id)
    os.makedirs(exp_dir, exist_ok=True)
    figures_dir = os.path.join(exp_dir, "figures")

    analytics_output = analytics_engine.analyze_experiment(
        experiment_id=experiment_id,
        scenarios_results=sim_output["scenarios"],
        figures_output_dir=figures_dir
    )

    # Convert state vectors for serialization
    serializable_scenarios = {}
    for sc_id, states in sim_output["scenarios"].items():
        serializable_scenarios[sc_id] = [s.model_dump() for s in states]

    rec["status"] = "completed"
    rec["config"]["status"] = "completed"
    rec["simulation_results"] = serializable_scenarios
    rec["analytics"] = analytics_output
    rec["completed_at"] = time.time()

    save_experiment_record(rec)

    return {
        "status": "completed",
        "experiment_id": experiment_id,
        "simulation_duration": config.simulation_duration,
        "scenario_count": len(config.scenarios),
        "analytics": analytics_output
    }


@router.get("/experiments/{experiment_id}/results")
def get_experiment_results(experiment_id: str) -> Dict[str, Any]:
    """Retrieves full year-wise trajectory data and analytics."""
    rec = load_experiment_record(experiment_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    if rec.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Experiment has not been executed yet. Run POST /run first.")
    return {
        "experiment_id": experiment_id,
        "config": rec["config"],
        "simulation_results": rec.get("simulation_results", {}),
        "analytics": rec.get("analytics", {})
    }


@router.post("/experiments/{experiment_id}/generate-paper")
def generate_paper(experiment_id: str) -> Dict[str, Any]:
    """
    Synthesizes the complete 26-section scientific research manuscript
    and compiles both PDF and DOCX documents.
    """
    rec = load_experiment_record(experiment_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    if rec.get("status") != "completed":
        # Auto-run if not completed
        run_experiment(experiment_id)
        rec = load_experiment_record(experiment_id)

    cfg_dict = rec["config"]
    config = PolicyExperimentConfig(**cfg_dict)

    # Reconstruct state vectors
    scenarios_results = {}
    for sc_id, s_list in rec.get("simulation_results", {}).items():
        scenarios_results[sc_id] = [CivilisationStateVector(**s) for s in s_list]

    analytics = rec.get("analytics", {})

    # 1. Generate 26-Section Scientific Manuscript
    manuscript = paper_generator.generate_manuscript(
        config=config,
        scenarios_results=scenarios_results,
        analytics=analytics
    )

    # 2. Export PDF
    exp_dir = os.path.join(EXPERIMENTS_DATA_DIR, experiment_id)
    pdf_path = os.path.join(exp_dir, f"CIVORA_Research_Paper_{experiment_id}.pdf")
    docx_path = os.path.join(exp_dir, f"CIVORA_Research_Paper_{experiment_id}.docx")

    export_service.export_pdf(
        config=config,
        manuscript=manuscript,
        analytics=analytics,
        output_filepath=pdf_path
    )

    # 3. Export DOCX
    export_service.export_docx(
        config=config,
        manuscript=manuscript,
        analytics=analytics,
        output_filepath=docx_path
    )

    rec["paper"] = {
        "manuscript": manuscript,
        "pdf_path": pdf_path,
        "docx_path": docx_path,
        "generated_at": time.time()
    }
    save_experiment_record(rec)

    return {
        "status": "generated",
        "experiment_id": experiment_id,
        "title": manuscript["title"],
        "abstract": manuscript["abstract"],
        "pdf_download_url": f"/api/v1/research/experiments/{experiment_id}/download/pdf",
        "docx_download_url": f"/api/v1/research/experiments/{experiment_id}/download/docx",
        "manuscript_sections": list(manuscript.keys())
    }


@router.get("/experiments/{experiment_id}/download/pdf")
def download_pdf(experiment_id: str):
    """Streams the generated publication PDF."""
    rec = load_experiment_record(experiment_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    
    exp_dir = os.path.join(EXPERIMENTS_DATA_DIR, experiment_id)
    pdf_path = os.path.join(exp_dir, f"CIVORA_Research_Paper_{experiment_id}.pdf")
    
    if not os.path.exists(pdf_path):
        # Auto-generate paper if missing
        generate_paper(experiment_id)

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Failed to locate generated PDF manuscript.")

    return FileResponse(
        path=pdf_path,
        filename=f"CIVORA_Research_Paper_{experiment_id}.pdf",
        media_type="application/pdf"
    )


@router.get("/experiments/{experiment_id}/download/docx")
def download_docx(experiment_id: str):
    """Streams the generated editable DOCX manuscript."""
    rec = load_experiment_record(experiment_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Experiment not found.")
        
    exp_dir = os.path.join(EXPERIMENTS_DATA_DIR, experiment_id)
    docx_path = os.path.join(exp_dir, f"CIVORA_Research_Paper_{experiment_id}.docx")
    
    if not os.path.exists(docx_path):
        # Auto-generate paper if missing
        generate_paper(experiment_id)

    if not os.path.exists(docx_path):
        raise HTTPException(status_code=500, detail="Failed to locate generated DOCX manuscript.")

    return FileResponse(
        path=docx_path,
        filename=f"CIVORA_Research_Paper_{experiment_id}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

