from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
import bcrypt

from database import get_db
import crud
import schemas
import models

# JWT Settings
SECRET_KEY = "super-secret-key-for-development"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

security = HTTPBearer()

# Helper functions for password and JWT token
def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get current user
def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user


@router.post("/signup", response_model=schemas.UserResponse)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user, hash password, and initialize their placement coordinator roadmap.
    """
    existing_user = crud.get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )

    # Hash the password
    password_hash = get_password_hash(user_in.password)
    
    # Create the user record
    new_user = crud.create_user(db, user_in, password_hash)

    # Initialize a default placement preparation roadmap for the new user
    default_steps = [
        {"id": "step1", "title": "Optimize Resume Formatting", "status": "In Progress", "agent": "Resume Agent"},
        {"id": "step2", "title": "Solve 2 Array & 2 String DSA Problems", "status": "Pending", "agent": "DSA Agent"},
        {"id": "step3", "title": "Complete 1 Behavioral HR Interview Session", "status": "Pending", "agent": "Interview Agent"},
        {"id": "step4", "title": "Review DB Indexing & System Design basics", "status": "Pending", "agent": "Technical Agent"}
    ]
    default_advice = f"Welcome {new_user.name}! I've initialized your profile. Start by scanning your resume or practicing DSA questions to begin your placement preparation."
    
    crud.create_or_update_roadmap(db, 0, default_steps, default_advice, new_user.id)

    return new_user


@router.post("/login", response_model=schemas.Token)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user, verify credentials, and return a JWT access token.
    """
    user = crud.get_user_by_email(db, email=login_in.email)
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Get the details of the currently logged-in user.
    """
    return current_user