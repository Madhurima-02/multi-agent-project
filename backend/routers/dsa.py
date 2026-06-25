from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from database import get_db
import crud
import schemas
import models
from routers.auth import get_current_user

router = APIRouter(
    prefix="/dsa",
    tags=["DSA Agent"]
)

@router.get("/problems", response_model=List[schemas.DsaProblemResponse])
def get_problems(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all available DSA problems.
    """
    return crud.get_dsa_problems(db)

@router.get("/problems/{problem_id}", response_model=schemas.DsaProblemResponse)
def get_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get a single DSA problem detail by ID.
    """
    problem = crud.get_dsa_problem(db, problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem

@router.post("/submit", response_model=schemas.DsaSubmissionResponse)
def submit_solution(
    submission_in: schemas.DsaSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Simulate running and evaluating DSA code submissions.
    """
    problem = crud.get_dsa_problem(db, submission_in.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
        
    # Evaluate code content for demo simulation
    code_text = submission_in.code
    
    # We do a basic heuristic: if code contains a return and is not empty, and has key terms, mark solved
    is_valid = len(code_text.strip()) > 30 and "def " in code_text and "return " in code_text
    
    # Custom validations per problem
    if problem.title == "Two Sum" and "dict" not in code_text.lower() and "hash" not in code_text.lower() and "for " not in code_text.lower():
        is_valid = False
        
    status = "Solved" if is_valid else "Failed"
    
    # Create the submission record for the authenticated user
    sub = crud.create_dsa_submission(db, schemas.DsaSubmissionCreate(
        problem_id=submission_in.problem_id,
        code=code_text,
        status=status
    ), current_user.id)
    
    # Update Coordinator roadmap based on solved status
    if status == "Solved":
        roadmap = crud.get_coordinator_roadmap(db, current_user.id)
        if roadmap:
            steps = json.loads(roadmap.roadmap_steps)
            solved_count = db.query(models.DsaSubmission).filter(
                models.DsaSubmission.status == "Solved",
                models.DsaSubmission.user_id == current_user.id
            ).count()
            
            # If solved at least 2 problems, mark DSA step as completed
            if solved_count >= 2:
                for step in steps:
                    if step["agent"] == "DSA Agent":
                        step["status"] = "Completed"
                        
            completed_steps = sum(1 for s in steps if s["status"] == "Completed")
            new_readiness = min(100, round((completed_steps / len(steps)) * 100))
            
            advice = roadmap.coordinator_advice
            if solved_count >= 2:
                advice = "Great job! You have solved 2+ DSA problems successfully. Ready to book your mock interview session next!"
                
            crud.create_or_update_roadmap(db, new_readiness, steps, advice, current_user.id)
            
    return sub

@router.get("/submissions", response_model=List[schemas.DsaSubmissionResponse])
def get_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all submission history for the logged-in user.
    """
    return crud.get_dsa_submissions(db, current_user.id)
