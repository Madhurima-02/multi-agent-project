from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import crud
import schemas
import models
from routers.auth import get_current_user

router = APIRouter(
    prefix="/resume",
    tags=["Resume Agent"]
)

@router.get("/history", response_model=List[schemas.ResumeAnalysisResponse])
def get_resume_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get a list of all historical resume analyses for the logged-in user.
    """
    return crud.get_resume_analyses(db, current_user.id)

@router.post("/analyze", response_model=schemas.ResumeAnalysisResponse)
def analyze_resume(
    analysis_in: schemas.ResumeAnalysisCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Simulate analyzing resume text and generate formatting/skill feedback scores.
    """
    # Create resume analysis associated with current user
    analysis = crud.create_resume_analysis(db, analysis_in, current_user.id)
    
    # Update Coordinator roadmap score dynamically based on latest resume
    roadmap = crud.get_coordinator_roadmap(db, current_user.id)
    if roadmap:
        import json
        steps = json.loads(roadmap.roadmap_steps)
        # Mark resume step as completed
        for step in steps:
            if step["agent"] == "Resume Agent":
                step["status"] = "Completed"
        
        # Calculate new overall readiness score
        completed_steps = sum(1 for s in steps if s["status"] == "Completed")
        new_readiness = min(100, round((completed_steps / len(steps)) * 100))
        
        advice = roadmap.coordinator_advice
        if analysis.score > 80:
            advice = "Excellent! Your resume score is outstanding. Now focus on solving the pending DSA challenges to unlock advanced mock rounds."
            
        crud.create_or_update_roadmap(db, new_readiness, steps, advice, current_user.id)
        
    return analysis
