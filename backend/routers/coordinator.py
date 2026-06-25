from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from database import get_db
import crud
import schemas
import models
from routers.auth import get_current_user

router = APIRouter(
    prefix="/coordinator",
    tags=["Coordinator Agent"]
)

@router.get("/roadmap", response_model=schemas.CoordinatorRoadmapResponse)
def get_roadmap(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get the overall placement preparation roadmap and readiness score for the user.
    """
    roadmap = crud.get_coordinator_roadmap(db, current_user.id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap details not initialized yet.")
    return roadmap

@router.post("/chat", response_model=schemas.CoordinatorChatResponse)
def chat_with_coordinator(
    request: schemas.CoordinatorChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Chat with the AI Coordinator agent. The coordinator aggregates context from
    Resume, DSA, and Interview rounds to answer placement-related queries.
    """
    user_msg = request.message.lower()
    
    # Gather database states for context scoped to the current user
    resume_history = crud.get_resume_analyses(db, current_user.id)
    dsa_submissions = crud.get_dsa_submissions(db, current_user.id)
    interview_sessions = crud.get_interview_sessions(db, current_user.id)
    
    solved_dsa = [sub for sub in dsa_submissions if sub.status == "Solved"]
    completed_interviews = [s for s in interview_sessions if s.status == "Completed"]
    
    # Basic analysis
    resume_score = resume_history[0].score if resume_history else 0
    dsa_count = len(solved_dsa)
    interview_count = len(completed_interviews)
    latest_interview_score = completed_interviews[0].score if completed_interviews else None
    
    reply = ""
    suggested_action = None
    
    # AI Coordinator intelligence response logic
    if "resume" in user_msg:
        if resume_score == 0:
            reply = "You haven't uploaded or analyzed a resume yet! I suggest going to the Resume Agent page to run your first formatting scan."
            suggested_action = "/resume"
        elif resume_score < 75:
            reply = f"Your latest resume scored {resume_score}%. The Resume Agent identified issues with action verbs and formatting. Let's fix that before applying to top companies."
            suggested_action = "/resume"
        else:
            reply = f"Your resume is in great shape with a score of {resume_score}%! Excellent work list-matching developer skills."
            
    elif "dsa" in user_msg or "code" in user_msg or "coding" in user_msg:
        if dsa_count == 0:
            reply = "You have not solved any DSA challenges yet. Coding round preparation is crucial. Try solving 'Two Sum' or 'Valid Palindrome' first."
            suggested_action = "/dsa"
        elif dsa_count < 3:
            reply = f"You have solved {dsa_count} problems. Practice makes perfect! I recommend tackling binary trees or graph islands next to round out your data structure coverage."
            suggested_action = "/dsa"
        else:
            reply = f"Superb! You solved {dsa_count} DSA challenges. Your coding metrics look solid. You should test these coding skills under pressure in a Mock Technical Interview."
            suggested_action = "/interview"
            
    elif "interview" in user_msg or "mock" in user_msg or "round" in user_msg:
        if interview_count == 0:
            reply = "You haven't attempted any mock interview simulations yet. Communicating your technical process is vital. Start a new Technical or HR interview now!"
            suggested_action = "/interview"
        else:
            reply = f"You have completed {interview_count} mock interview(s). Your latest performance scored {latest_interview_score}%. Keep practicing to build confidence!"
            
    elif "ready" in user_msg or "google" in user_msg or "microsoft" in user_msg or "status" in user_msg:
        if resume_score >= 80 and dsa_count >= 2 and interview_count >= 1:
            reply = f"Congratulations {current_user.name}! You have optimized your resume, solved core DSA tracks, and passed your behavioral simulation. You are fully ready to apply for SDE placements!"
        else:
            checks = []
            if resume_score < 80: checks.append("improve your resume score above 80%")
            if dsa_count < 2: checks.append("solve at least 2 DSA problems")
            if interview_count == 0: checks.append("complete a mock interview session")
            
            reply = f"You are making good progress {current_user.name}, but you aren't fully company-ready yet. You still need to: {', '.join(checks)}. Keep pushing!"
            
    else:
        # Default conversational orchestrator response
        reply = (
            f"Hello {current_user.name}! I am your AI Placement Coordinator. I keep track of your performance across DSA, Resumes, and Mock Interviews. "
            "Ask me things like: 'Am I ready for placements?', 'How is my DSA progress?', or 'What should I do with my resume?' and I will check your database records."
        )
        
    return schemas.CoordinatorChatResponse(
        reply=reply,
        suggested_action=suggested_action
    )
