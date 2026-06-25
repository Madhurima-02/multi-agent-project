from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime
from database import get_db
import crud
import schemas
import models
from routers.auth import get_current_user

router = APIRouter(
    prefix="/interview",
    tags=["Interview Agent"]
)

@router.get("/sessions", response_model=List[schemas.InterviewSessionResponse])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all past and active interview sessions for the logged-in user.
    """
    return crud.get_interview_sessions(db, current_user.id)

@router.post("/session", response_model=schemas.InterviewSessionResponse)
def create_session(
    session_in: schemas.InterviewSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Start a new mock interview session (Technical or HR) for the user.
    """
    return crud.create_interview_session(db, session_in.session_type, current_user.id)

@router.get("/session/{session_id}", response_model=schemas.InterviewSessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get details of a specific interview session.
    """
    session = crud.get_interview_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/session/{session_id}/message", response_model=schemas.InterviewSessionResponse)
def send_message(
    session_id: int,
    message_in: schemas.InterviewMessageSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Send a candidate message and receive the simulated recruiter/interviewer reply.
    """
    session = crud.get_interview_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.status == "Completed":
        raise HTTPException(status_code=400, detail="This session is already completed.")
        
    # Load previous messages
    messages = json.loads(session.messages)
    
    # Append candidate response
    messages.append({
        "sender": "candidate",
        "text": message_in.text,
        "timestamp": datetime.now().strftime("%H:%M")
    })
    
    # Calculate how many questions the interviewer has asked
    questions_asked = sum(1 for m in messages if m["sender"] == "interviewer")
    
    # Fetch questions available
    all_questions = crud.get_interview_questions(db, session.session_type)
    
    # Simple logic: If we have asked 3 questions already, let's wrap up and trigger evaluation!
    if questions_asked >= 3:
        # Wrap up message
        messages.append({
            "sender": "interviewer",
            "text": "Thank you! That concludes our questions. I will now compile your placement evaluation score. Please click 'Complete Evaluation' to see your metrics.",
            "timestamp": datetime.now().strftime("%H:%M")
        })
        session.messages = json.dumps(messages)
        db.commit()
        return session
        
    # Otherwise, ask the next question
    next_q = None
    # Find a question that hasn't been asked yet in the conversation
    for q in all_questions:
        already_asked = any(q.question_text in m["text"] for m in messages)
        if not already_asked:
            next_q = q
            break
            
    if not next_q:
        # Fallback question if none found
        if session.session_type == "Technical":
            next_q_text = "Can you describe how you handle debugging production errors or software exceptions?"
        else:
            next_q_text = "Tell me about your long-term career goals and how you plan to contribute to our engineering culture."
    else:
        next_q_text = next_q.question_text
        
    messages.append({
        "sender": "interviewer",
        "text": next_q_text,
        "timestamp": datetime.now().strftime("%H:%M")
    })
    
    session.messages = json.dumps(messages)
    db.commit()
    db.refresh(session)
    return session

@router.post("/session/{session_id}/conclude", response_model=schemas.InterviewSessionResponse)
def conclude_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Analyze the session transcript and grade the candidate's performance.
    """
    session = crud.get_interview_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.status == "Completed" and session.score is not None:
        return session
        
    # Analyze messages
    messages = json.loads(session.messages)
    candidate_responses = [m["text"].lower() for m in messages if m["sender"] == "candidate"]
    
    # We count word limits and check keyword matching to construct mock grading
    total_words = sum(len(resp.split()) for resp in candidate_responses)
    avg_length = total_words / max(len(candidate_responses), 1)
    
    # Grade communication score based on detail/length of answers
    communication_score = 60
    if avg_length > 40:
        communication_score = 90
    elif avg_length > 20:
        communication_score = 78
        
    # Grade knowledge score based on technical keyword match simulation
    knowledge_score = 65
    all_questions = crud.get_interview_questions(db, session.session_type)
    matches = 0
    for q in all_questions:
        keywords = [k.strip().lower() for k in q.evaluation_keywords.split(",") if q.evaluation_keywords]
        for resp in candidate_responses:
            for kw in keywords:
                if kw in resp:
                    matches += 1
                    
    knowledge_score = min(knowledge_score + (matches * 6), 96)
    overall_score = round((communication_score + knowledge_score) / 2)
    
    # Formulate feedback text
    feedback_lines = []
    if session.session_type == "Technical":
        feedback_lines.append("Excellent logical structure in technical answering.")
        if knowledge_score < 75:
            feedback_lines.append("Recommendation: Revise core terminologies. Try to use specific keyword tags (like B-Tree index structure, function hooks, closures) when answering.")
        else:
            feedback_lines.append("Great job matching complex key architectural concepts during the technical session.")
    else:
        feedback_lines.append("Very pleasant demeanor and collaborative spirit shown in behavioral responses.")
        if communication_score < 75:
            feedback_lines.append("Recommendation: Try using the STAR method (Situation, Task, Action, Result) to provide structure and metrics for behavioral questions.")
        else:
            feedback_lines.append("Your answers showed structured thinking, demonstrating strong conflict resolution and alignment skills.")
            
    feedback = " ".join(feedback_lines)
    
    session.status = "Completed"
    session.score = overall_score
    session.communication_score = communication_score
    session.knowledge_score = knowledge_score
    session.feedback = feedback
    
    db.commit()
    
    # Update Coordinator overall preparation readiness score
    roadmap = crud.get_coordinator_roadmap(db, current_user.id)
    if roadmap:
        steps = json.loads(roadmap.roadmap_steps)
        # Mark interview step as completed
        for step in steps:
            if step["agent"] == "Interview Agent" and session.session_type == "HR":
                step["status"] = "Completed"
            elif step["agent"] == "Technical Agent" and session.session_type == "Technical":
                step["status"] = "Completed"
                
        completed_steps = sum(1 for s in steps if s["status"] == "Completed")
        new_readiness = min(100, round((completed_steps / len(steps)) * 100))
        
        advice = roadmap.coordinator_advice
        if overall_score > 80:
            advice = f"Superb! You finished your {session.session_type} mock interview with a score of {overall_score}%. The coordinator rates you as company-ready in this division!"
            
        crud.create_or_update_roadmap(db, new_readiness, steps, advice, current_user.id)
        
    db.refresh(session)
    return session
