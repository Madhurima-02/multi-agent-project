from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# ================= DSA Schemas =================

class DsaProblemBase(BaseModel):
    title: str
    difficulty: str
    category: str
    description: str
    starter_code: str
    test_cases: str
    solution_hint: str

class DsaProblemResponse(DsaProblemBase):
    id: int

    class Config:
        from_attributes = True

class DsaSubmissionCreate(BaseModel):
    problem_id: int
    code: str
    status: str  # Solved, Failed

class DsaSubmissionResponse(BaseModel):
    id: int
    problem_id: int
    code: str
    status: str
    submitted_at: datetime

    class Config:
        from_attributes = True

# ================= Resume Schemas =================

class ResumeAnalysisCreate(BaseModel):
    resume_name: str
    resume_text: str  # We simulate text submission for easy testing

class ResumeAnalysisResponse(BaseModel):
    id: int
    resume_name: str
    score: int
    extracted_skills: str  # JSON list
    experience_score: int
    ats_score: int
    suggestions: str  # JSON array/object of suggestions
    analyzed_at: datetime

    class Config:
        from_attributes = True

# ================= Interview Schemas =================

class InterviewQuestionResponse(BaseModel):
    id: int
    question_type: str
    category: str
    question_text: str
    sample_answer: str

    class Config:
        from_attributes = True

class InterviewSessionCreate(BaseModel):
    session_type: str  # Technical, HR

class MessageItem(BaseModel):
    sender: str  # interviewer, candidate
    text: str
    timestamp: Optional[str] = None

class InterviewSessionResponse(BaseModel):
    id: int
    session_type: str
    messages: str  # JSON list of MessageItem
    status: str
    score: Optional[int] = None
    communication_score: Optional[int] = None
    knowledge_score: Optional[int] = None
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewMessageSubmit(BaseModel):
    text: str

# ================= Coordinator Schemas =================

class CoordinatorRoadmapResponse(BaseModel):
    id: int
    overall_readiness: int
    roadmap_steps: str  # JSON array of steps
    coordinator_advice: str
    updated_at: datetime

    class Config:
        from_attributes = True

class CoordinatorChatRequest(BaseModel):
    message: str

class CoordinatorChatResponse(BaseModel):
    reply: str
    suggested_action: Optional[str] = None  # Redirect suggestion

# ================= User / Auth Schemas =================

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    target_role: Optional[str] = "SDE Placement Target"

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    target_role: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
