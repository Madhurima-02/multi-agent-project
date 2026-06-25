from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite Database connection URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./placement_assistant.db"

# Create database engine. connect_args={"check_same_thread": False} is required for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a session local class for db sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for models
Base = declarative_base()

# Dependency to get db session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
