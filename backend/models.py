import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    target_role = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    resume_analyses = relationship("ResumeAnalysis", back_populates="user")
    dsa_submissions = relationship("DsaSubmission", back_populates="user")
    interview_sessions = relationship("InterviewSession", back_populates="user")
    coordinator_roadmaps = relationship("CoordinatorRoadmap", back_populates="user")

class DsaProblem(Base):
    __tablename__ = "dsa_problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    difficulty = Column(String)  # Easy, Medium, Hard
    category = Column(String)  # Arrays, Strings, Linked Lists, Trees, Graphs
    description = Column(Text)
    starter_code = Column(Text)
    test_cases = Column(Text)  # JSON string of test cases
    solution_hint = Column(Text)

    submissions = relationship("DsaSubmission", back_populates="problem")

class DsaSubmission(Base):
    __tablename__ = "dsa_submissions"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("dsa_problems.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(Text)
    status = Column(String)  # Solved, Failed, Draft
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    problem = relationship("DsaProblem", back_populates="submissions")
    user = relationship("User", back_populates="dsa_submissions")

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_name = Column(String)
    score = Column(Integer)  # 0 to 100
    extracted_skills = Column(Text)  # JSON string array of skills
    experience_score = Column(Integer)  # 0 to 100
    ats_score = Column(Integer)  # 0 to 100
    suggestions = Column(Text)  # JSON string representing structural tips
    analyzed_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="resume_analyses")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    question_type = Column(String)  # Technical, HR
    category = Column(String)  # e.g., Databases, React, Python, Behavioral
    question_text = Column(Text)
    sample_answer = Column(Text)
    evaluation_keywords = Column(Text)  # Comma-separated list

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_type = Column(String)  # Technical, HR
    messages = Column(Text)  # JSON string representing conversation history
    status = Column(String)  # In Progress, Completed
    score = Column(Integer, nullable=True)  # Overall score (0-100)
    communication_score = Column(Integer, nullable=True)  # 0-100
    knowledge_score = Column(Integer, nullable=True)  # 0-100
    feedback = Column(Text, nullable=True)  # Detailed AI interviewer evaluation
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="interview_sessions")

class CoordinatorRoadmap(Base):
    __tablename__ = "coordinator_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    overall_readiness = Column(Integer, default=0)  # 0 to 100
    roadmap_steps = Column(Text)  # JSON string of stages/checklist
    coordinator_advice = Column(Text)  # AI coordinator's final text advice
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="coordinator_roadmaps")
