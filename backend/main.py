from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal
from routers import resume, dsa, interview, coordinator, auth
import crud

# Create database tables
# Force drop and rebuild if the database structure is outdated (e.g. users table is missing)
try:
    from sqlalchemy import inspect
    inspector = inspect(engine)
    if not inspector.has_table("users"):
        print("Migrating schema: users table not found. Re-creating tables...")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error checking database table status. Forcing table rebuild: {e}")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

# Pre-load initial mock datasets if the tables are empty
db = SessionLocal()
try:
    crud.preload_mock_data(db)
finally:
    db.close()

# Initialize FastAPI application
app = FastAPI(
    title="Multi-Agent Placement Assistant API",
    description="Backend API services managing resume scoring, coding challenges, and mock interview state.",
    version="1.0.0"
)

# Set up CORS middleware to allow connection from Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. Adjust to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include sub-routers for each agent
app.include_router(auth.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(dsa.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(coordinator.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the Multi-Agent Placement Assistant backend services."
    }
