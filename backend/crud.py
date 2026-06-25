import json
import bcrypt
from datetime import datetime
from sqlalchemy.orm import Session
import models
import schemas


# ================= User CRUD =================

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate, password_hash: str):
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=password_hash,
        target_role=user.target_role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# ================= DSA CRUD =================

def get_dsa_problems(db: Session):
    return db.query(models.DsaProblem).all()

def get_dsa_problem(db: Session, problem_id: int):
    return db.query(models.DsaProblem).filter(models.DsaProblem.id == problem_id).first()

def create_dsa_submission(db: Session, submission: schemas.DsaSubmissionCreate, user_id: int):
    db_sub = models.DsaSubmission(
        problem_id=submission.problem_id,
        user_id=user_id,
        code=submission.code,
        status=submission.status
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

def get_dsa_submissions(db: Session, user_id: int):
    return db.query(models.DsaSubmission).filter(models.DsaSubmission.user_id == user_id).all()

# ================= Resume CRUD =================

def get_resume_analyses(db: Session, user_id: int):
    return db.query(models.ResumeAnalysis).filter(models.ResumeAnalysis.user_id == user_id).order_by(models.ResumeAnalysis.analyzed_at.desc()).all()

def create_resume_analysis(db: Session, analysis: schemas.ResumeAnalysisCreate, user_id: int):
    # Simulate an AI parser analyzing the resume text.
    # We look for keywords in the text to dynamically adjust the score and skills.
    text_lower = analysis.resume_text.lower()
    
    # Simple rule-based skill extraction for simulation
    all_possible_skills = ["React", "Python", "SQL", "Node.js", "Java", "C++", "Docker", "Git", "FastAPI", "SQLite", "Machine Learning", "HTML", "CSS"]
    extracted = [skill for skill in all_possible_skills if skill.lower() in text_lower]
    if not extracted:
        extracted = ["Python", "SQL", "Git"]  # Default fallbacks
        
    # Calculate simulated scores
    score_base = 50
    # More skills = higher score
    score_base += min(len(extracted) * 4, 25)
    # Experience simulation
    experience_score = 65
    if "intern" in text_lower or "internship" in text_lower or "experience" in text_lower:
        experience_score += 15
        score_base += 10
    if "project" in text_lower or "projects" in text_lower:
        score_base += 10
        
    # Calculate ATS / overall
    ats_score = min(score_base + 5, 98)
    overall_score = min(round((score_base + experience_score + ats_score) / 3), 100)
    
    # Generate suggestions
    suggestions = []
    if "docker" not in text_lower and "kubernetes" not in text_lower:
        suggestions.append({
            "section": "Skills",
            "impact": "Medium",
            "text": "Add DevOps or containerization tools like Docker to stand out for modern software roles."
        })
    if len(extracted) < 5:
        suggestions.append({
            "section": "Skills",
            "impact": "High",
            "text": "List more technical skills. Include frameworks and databases you have worked with."
        })
    if "achieved" not in text_lower and "improved" not in text_lower and "managed" not in text_lower:
        suggestions.append({
            "section": "Experience",
            "impact": "High",
            "text": "Use action verbs (e.g., 'Optimized query speed by 20%', 'Led a team of 3') rather than listing passive tasks."
        })
    if "github.com" not in text_lower and "linkedin.com" not in text_lower:
        suggestions.append({
            "section": "Contact Information",
            "impact": "Medium",
            "text": "Ensure clickable links to GitHub and LinkedIn profiles are in your header."
        })
        
    if not suggestions:
        suggestions.append({
            "section": "Overall",
            "impact": "Low",
            "text": "Your resume looks exceptional! Try tailoring it with specific keywords from job descriptions before applying."
        })

    db_analysis = models.ResumeAnalysis(
        user_id=user_id,
        resume_name=analysis.resume_name,
        score=overall_score,
        extracted_skills=json.dumps(extracted),
        experience_score=experience_score,
        ats_score=ats_score,
        suggestions=json.dumps(suggestions)
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

# ================= Interview CRUD =================

def get_interview_questions(db: Session, q_type: str = None):
    query = db.query(models.InterviewQuestion)
    if q_type:
        query = query.filter(models.InterviewQuestion.question_type == q_type)
    return query.all()

def create_interview_session(db: Session, session_type: str, user_id: int):
    # Fetch questions for this type to start
    questions = get_interview_questions(db, session_type)
    first_question = "Welcome to the interview! Can you introduce yourself and tell me about your background?"
    if session_type == "Technical" and questions:
        first_question = f"Hello! Let's start the technical round. {questions[0].question_text}"
    elif session_type == "HR" and questions:
        first_question = f"Hi there! Let's begin the HR behavioral round. {questions[0].question_text}"

    initial_messages = [
        {"sender": "interviewer", "text": first_question, "timestamp": datetime.now().strftime("%H:%M")}
    ]

    db_session = models.InterviewSession(
        user_id=user_id,
        session_type=session_type,
        messages=json.dumps(initial_messages),
        status="In Progress"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_interview_session(db: Session, session_id: int, user_id: int):
    return db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id, models.InterviewSession.user_id == user_id).first()

def get_interview_sessions(db: Session, user_id: int):
    return db.query(models.InterviewSession).filter(models.InterviewSession.user_id == user_id).order_by(models.InterviewSession.created_at.desc()).all()

# ================= Coordinator CRUD =================

def get_coordinator_roadmap(db: Session, user_id: int):
    return db.query(models.CoordinatorRoadmap).filter(models.CoordinatorRoadmap.user_id == user_id).order_by(models.CoordinatorRoadmap.updated_at.desc()).first()

def create_or_update_roadmap(db: Session, readiness: int, steps: list, advice: str, user_id: int):
    roadmap = get_coordinator_roadmap(db, user_id)
    if not roadmap:
        roadmap = models.CoordinatorRoadmap(
            user_id=user_id,
            overall_readiness=readiness,
            roadmap_steps=json.dumps(steps),
            coordinator_advice=advice
        )
        db.add(roadmap)
    else:
        roadmap.overall_readiness = readiness
        roadmap.roadmap_steps = json.dumps(steps)
        roadmap.coordinator_advice = advice
    db.commit()
    db.refresh(roadmap)
    return roadmap

# ================= Mock Data Preloader =================

def preload_mock_data(db: Session):
    # 1. Preload DSA Problems if empty
    if db.query(models.DsaProblem).count() == 0:
        dsa_mocks = [
            models.DsaProblem(
                title="Two Sum",
                difficulty="Easy",
                category="Arrays",
                description=(
                    "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\n"
                    "You may assume that each input would have exactly one solution, and you may not use the same element twice.\n\n"
                    "**Example 1:**\n"
                    "```\n"
                    "Input: nums = [2,7,11,15], target = 9\n"
                    "Output: [0,1]\n"
                    "Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].\n"
                    "```"
                ),
                starter_code="def two_sum(nums, target):\n    # Write your code here\n    pass",
                test_cases=json.dumps([
                    {"input": "[2, 7, 11, 15], 9", "output": "[0, 1]"},
                    {"input": "[3, 2, 4], 6", "output": "[1, 2]"}
                ]),
                solution_hint="Try using a hash map (dictionary in Python) to keep track of the complements (target - nums[i]) and their indices as you iterate."
            ),
            models.DsaProblem(
                title="Valid Palindrome",
                difficulty="Easy",
                category="Strings",
                description=(
                    "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\n"
                    "Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.\n\n"
                    "**Example 1:**\n"
                    "```\n"
                    "Input: s = \"A man, a plan, a canal: Panama\"\n"
                    "Output: true\n"
                    "Explanation: \"amanaplanacanalpanama\" is a palindrome.\n"
                    "```"
                ),
                starter_code="def is_palindrome(s):\n    # Write your code here\n    pass",
                test_cases=json.dumps([
                    {"input": '\"A man, a plan, a canal: Panama\"', "output": "True"},
                    {"input": '\"race a car\"', "output": "False"}
                ]),
                solution_hint="Filter the string to keep only alphanumeric characters in lowercase. Then check if the string equals its reverse, or use two pointers moving inward."
            ),
            models.DsaProblem(
                title="Reverse Linked List",
                difficulty="Easy",
                category="Linked Lists",
                description=(
                    "Given the head of a singly linked list, reverse the list, and return the reversed list.\n\n"
                    "**Example 1:**\n"
                    "```\n"
                    "Input: head = [1,2,3,4,5]\n"
                    "Output: [5,4,3,2,1]\n"
                    "```"
                ),
                starter_code="class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    # Write your code here\n    pass",
                test_cases=json.dumps([
                    {"input": "[1, 2, 3]", "output": "[3, 2, 1]"}
                ]),
                solution_hint="Maintain three pointers: prev (initially None), curr (initially head), and next. Iterate through, redirecting curr.next to prev, then shift all pointers forward."
            ),
            models.DsaProblem(
                title="Maximum Depth of Binary Tree",
                difficulty="Easy",
                category="Trees",
                description=(
                    "Given the root of a binary tree, return its maximum depth.\n\n"
                    "A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.\n\n"
                    "**Example 1:**\n"
                    "```\n"
                    "Input: root = [3,9,20,null,null,15,7]\n"
                    "Output: 3\n"
                    "```"
                ),
                starter_code="class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef max_depth(root):\n    # Write your code here\n    pass",
                test_cases=json.dumps([
                    {"input": "[3, 9, 20, None, None, 15, 7]", "output": "3"}
                ]),
                solution_hint="Use recursion (DFS). The maximum depth is 1 + max(max_depth(root.left), max_depth(root.right)). The base case is when root is None, returning 0."
            ),
            models.DsaProblem(
                title="Number of Islands",
                difficulty="Medium",
                category="Graphs",
                description=(
                    "Given an `m x n` 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.\n\n"
                    "An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.\n\n"
                    "**Example 1:**\n"
                    "```\n"
                    "Input: grid = [\n"
                    "  [\"1\",\"1\",\"1\",\"1\",\"0\"],\n"
                    "  [\"1\",\"1\",\"0\",\"1\",\"0\"],\n"
                    "  [\"1\",\"1\",\"0\",\"0\",\"0\"],\n"
                    "  [\"0\",\"0\",\"0\",\"0\",\"0\"]\n"
                    "]\n"
                    "Output: 1\n"
                    "```"
                ),
                starter_code="def num_islands(grid):\n    # Write your code here\n    pass",
                test_cases=json.dumps([
                    {"input": '[["1","1","0"],["1","1","0"],["0","0","1"]]', "output": "2"}
                ]),
                solution_hint="Traverse the grid. When you hit a '1', increment island count and use Breadth First Search (BFS) or Depth First Search (DFS) to mark all connected lands ('1') as visited ('0')."
            )
        ]
        db.add_all(dsa_mocks)
        db.commit()

    # 2. Preload Interview Questions if empty
    if db.query(models.InterviewQuestion).count() == 0:
        questions_mock = [
            models.InterviewQuestion(
                question_type="Technical",
                category="Databases",
                question_text="Explain Database Indexing and how it speeds up query execution.",
                sample_answer="Database indexing is a data structure technique (commonly using B-Trees or Hash tables) to quickly locate and access the data in database tables without scanning every row. It acts like an index in the back of a book, pointing directly to the row identifiers where target values reside.",
                evaluation_keywords="B-Tree, scan, key, lookup, secondary, binary search"
            ),
            models.InterviewQuestion(
                question_type="Technical",
                category="React",
                question_text="What are React hooks, and what benefits do they bring compared to traditional class components?",
                sample_answer="React hooks (introduced in v16.8) allow developers to use state and other React features in functional components. They eliminate class boilerplates, make it easier to share stateful logic between components, and improve readability and testability.",
                evaluation_keywords="functional component, state, lifecycle, useState, useEffect, reuse"
            ),
            models.InterviewQuestion(
                question_type="Technical",
                category="Python",
                question_text="Explain Python's Global Interpreter Lock (GIL) and its impact on multi-threaded programs.",
                sample_answer="The GIL is a mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes at once in CPython. This means CPU-bound multi-threaded programs cannot run in true parallel on multi-core systems, though I/O-bound tasks still benefit from threading.",
                evaluation_keywords="CPython, mutex, concurrency, CPU-bound, thread, multiprocessing"
            ),
            models.InterviewQuestion(
                question_type="HR",
                category="Behavioral",
                question_text="Tell me about a time when you had a disagreement with a team member. How did you resolve it?",
                sample_answer="In a group project, we disagreed on using NoSQL vs PostgreSQL. I organized a brief comparison meeting where we evaluated read/write speeds and schema flexibility. We decided on PostgreSQL collectively based on structured relation requirements, which taught me the value of structured evaluations and collaborative compromise.",
                evaluation_keywords="collaboration, communication, project, listening, resolution, alignment"
            ),
            models.InterviewQuestion(
                question_type="HR",
                category="Behavioral",
                question_text="Why should we hire you for this Software Engineer Placement role?",
                sample_answer="You should hire me because I combine core computer science foundation (DSA, Databases) with practical experience in frontend React development and building backend APIs. I am an active learner, adaptable to new systems, and driven to solve business problems with clean, scalable code.",
                evaluation_keywords="skills, learning, problem solving, impact, projects, teamwork"
            )
        ]
        db.add_all(questions_mock)
        db.commit()

    # 3. Preload a default User if empty (Alex Developer)
    alex = db.query(models.User).filter(models.User.email == "alex@developer.com").first()
    if not alex:
        pwd_bytes = "password123".encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
        
        alex = models.User(
            name="Alex Developer",
            email="alex@developer.com",
            password_hash=hashed_password,
            target_role="SDE Placement Target"
        )
        db.add(alex)
        db.commit()
        db.refresh(alex)

    # 4. Preload a mock Resume Analysis if empty to represent Alex's historical state
    if db.query(models.ResumeAnalysis).filter(models.ResumeAnalysis.user_id == alex.id).count() == 0:
        resume_mock = models.ResumeAnalysis(
            user_id=alex.id,
            resume_name="Alex_Developer_Resume_v1.pdf",
            score=72,
            extracted_skills=json.dumps(["React", "JavaScript", "Python", "SQL", "Git"]),
            experience_score=70,
            ats_score=75,
            suggestions=json.dumps([
                {
                    "section": "Skills",
                    "impact": "Medium",
                    "text": "Add DevOps or containerization tools like Docker to stand out for modern software roles."
                },
                {
                    "section": "Experience",
                    "impact": "High",
                    "text": "Use action verbs (e.g., 'Optimized query speed by 20%') rather than listing passive tasks."
                }
            ])
        )
        db.add(resume_mock)
        db.commit()

    # 5. Preload a default Coordinator Roadmap if empty for Alex
    if db.query(models.CoordinatorRoadmap).filter(models.CoordinatorRoadmap.user_id == alex.id).count() == 0:
        steps_mock = [
            {"id": "step1", "title": "Optimize Resume Formatting", "status": "In Progress", "agent": "Resume Agent"},
            {"id": "step2", "title": "Solve 2 Array & 2 String DSA Problems", "status": "Pending", "agent": "DSA Agent"},
            {"id": "step3", "title": "Complete 1 Behavioral HR Interview Session", "status": "Pending", "agent": "Interview Agent"},
            {"id": "step4", "title": "Review DB Indexing & System Design basics", "status": "Pending", "agent": "Technical Agent"}
        ]
        roadmap_mock = models.CoordinatorRoadmap(
            user_id=alex.id,
            overall_readiness=35,
            roadmap_steps=json.dumps(steps_mock),
            coordinator_advice="Welcome Alex! I've scanned your profile. You have a solid base in Python and SQL, but you need to optimize your resume impact verbs and solve basic Array/String problems to unlock technical interview mock assessments. Let's start with your resume first!"
        )
        db.add(roadmap_mock)
        db.commit()
