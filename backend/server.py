from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import hashlib
import jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = "your-secret-key-change-in-production"

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password: str
    paralelo_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    paralelo_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    paralelo_name: str
    created_at: datetime

class Student(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    cedula: str
    tesorero_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCreate(BaseModel):
    name: str
    cedula: str

class PaymentSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tesorero_id: str
    monthly_amount: float
    selected_months: List[str]
    academic_year: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentSettingsCreate(BaseModel):
    monthly_amount: float
    selected_months: List[str]
    academic_year: str

class MonthlyPayment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    month: str
    year: str
    paid: bool = False
    amount: float
    receipt_image: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    student_id: str
    month: str
    year: str
    amount: float
    receipt_image: Optional[str] = None

class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tesorero_id: str
    responsible_student_id: str
    description: str
    amount: float
    activity_image: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    responsible_student_id: str
    description: str
    amount: float
    activity_image: Optional[str] = None

class DashboardSummary(BaseModel):
    total_income: float
    total_expenses: float
    current_balance: float
    total_students: int
    pending_payments: int

class PublicStudentInfo(BaseModel):
    name: str
    cedula: str
    payments: List[MonthlyPayment]
    total_paid: float

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    return hash_password(password) == hashed_password

def create_jwt_token(user_id: str) -> str:
    payload = {"user_id": user_id, "exp": datetime.now(timezone.utc).timestamp() + 86400}  # 24 hours
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_jwt_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = decode_jwt_token(credentials.credentials)
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return UserResponse(**user)

def prepare_for_mongo(data):
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    return item

# Authentication routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create user
    user = User(
        username=user_data.username,
        password=hash_password(user_data.password),
        paralelo_name=user_data.paralelo_name
    )
    
    user_dict = prepare_for_mongo(user.dict())
    await db.users.insert_one(user_dict)
    
    return {"message": "User registered successfully"}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"username": login_data.username})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["id"])
    user_response = UserResponse(**parse_from_mongo(user))
    
    return {"token": token, "user": user_response}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

# Student management routes
@api_router.post("/students", response_model=Student)
async def create_student(student_data: StudentCreate, current_user: UserResponse = Depends(get_current_user)):
    # Check if cedula already exists for this tesorero
    existing_student = await db.students.find_one({"cedula": student_data.cedula, "tesorero_id": current_user.id})
    if existing_student:
        raise HTTPException(status_code=400, detail="Student with this cedula already exists")
    
    student = Student(
        name=student_data.name,
        cedula=student_data.cedula,
        tesorero_id=current_user.id
    )
    
    student_dict = prepare_for_mongo(student.dict())
    await db.students.insert_one(student_dict)
    
    return student

@api_router.get("/students", response_model=List[Student])
async def get_students(current_user: UserResponse = Depends(get_current_user)):
    students = await db.students.find({"tesorero_id": current_user.id}).to_list(1000)
    return [Student(**parse_from_mongo(student)) for student in students]

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: UserResponse = Depends(get_current_user)):
    # Check if student belongs to current user
    student = await db.students.find_one({"id": student_id, "tesorero_id": current_user.id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Delete student and all related payments
    await db.students.delete_one({"id": student_id})
    await db.payments.delete_many({"student_id": student_id})
    
    return {"message": "Student deleted successfully"}

# Payment settings routes
@api_router.post("/payment-settings", response_model=PaymentSettings)
async def create_payment_settings(settings_data: PaymentSettingsCreate, current_user: UserResponse = Depends(get_current_user)):
    # Delete existing settings for this user
    await db.payment_settings.delete_many({"tesorero_id": current_user.id})
    
    settings = PaymentSettings(
        tesorero_id=current_user.id,
        monthly_amount=settings_data.monthly_amount,
        selected_months=settings_data.selected_months,
        academic_year=settings_data.academic_year
    )
    
    settings_dict = prepare_for_mongo(settings.dict())
    await db.payment_settings.insert_one(settings_dict)
    
    return settings

@api_router.get("/payment-settings", response_model=Optional[PaymentSettings])
async def get_payment_settings(current_user: UserResponse = Depends(get_current_user)):
    settings = await db.payment_settings.find_one({"tesorero_id": current_user.id})
    if settings:
        return PaymentSettings(**parse_from_mongo(settings))
    return None

# Payment routes
@api_router.post("/payments", response_model=MonthlyPayment)
async def create_payment(payment_data: PaymentCreate, current_user: UserResponse = Depends(get_current_user)):
    # Verify student belongs to current user
    student = await db.students.find_one({"id": payment_data.student_id, "tesorero_id": current_user.id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if payment already exists
    existing_payment = await db.payments.find_one({
        "student_id": payment_data.student_id,
        "month": payment_data.month,
        "year": payment_data.year
    })
    
    if existing_payment:
        # Update existing payment
        await db.payments.update_one(
            {"id": existing_payment["id"]},
            {"$set": {
                "paid": True,
                "amount": payment_data.amount,
                "receipt_image": payment_data.receipt_image,
                "created_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        updated_payment = await db.payments.find_one({"id": existing_payment["id"]})
        return MonthlyPayment(**parse_from_mongo(updated_payment))
    else:
        # Create new payment
        payment = MonthlyPayment(
            student_id=payment_data.student_id,
            month=payment_data.month,
            year=payment_data.year,
            paid=True,
            amount=payment_data.amount,
            receipt_image=payment_data.receipt_image
        )
        
        payment_dict = prepare_for_mongo(payment.dict())
        await db.payments.insert_one(payment_dict)
        
        return payment

@api_router.get("/payments", response_model=List[MonthlyPayment])
async def get_payments(current_user: UserResponse = Depends(get_current_user)):
    # Get all students for this tesorero
    students = await db.students.find({"tesorero_id": current_user.id}).to_list(1000)
    student_ids = [student["id"] for student in students]
    
    # Get all payments for these students
    payments = await db.payments.find({"student_id": {"$in": student_ids}}).to_list(1000)
    return [MonthlyPayment(**parse_from_mongo(payment)) for payment in payments]

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, current_user: UserResponse = Depends(get_current_user)):
    # Find payment and verify it belongs to current user
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify student belongs to current user
    student = await db.students.find_one({"id": payment["student_id"], "tesorero_id": current_user.id})
    if not student:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    await db.payments.delete_one({"id": payment_id})
    return {"message": "Payment deleted successfully"}

# Expense routes
@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate, current_user: UserResponse = Depends(get_current_user)):
    # Verify responsible student belongs to current user
    student = await db.students.find_one({"id": expense_data.responsible_student_id, "tesorero_id": current_user.id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    expense = Expense(
        tesorero_id=current_user.id,
        responsible_student_id=expense_data.responsible_student_id,
        description=expense_data.description,
        amount=expense_data.amount,
        activity_image=expense_data.activity_image
    )
    
    expense_dict = prepare_for_mongo(expense.dict())
    await db.expenses.insert_one(expense_dict)
    
    return expense

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(current_user: UserResponse = Depends(get_current_user)):
    expenses = await db.expenses.find({"tesorero_id": current_user.id}).to_list(1000)
    return [Expense(**parse_from_mongo(expense)) for expense in expenses]

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: UserResponse = Depends(get_current_user)):
    # Check if expense belongs to current user
    expense = await db.expenses.find_one({"id": expense_id, "tesorero_id": current_user.id})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    await db.expenses.delete_one({"id": expense_id})
    return {"message": "Expense deleted successfully"}

# Dashboard route
@api_router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(current_user: UserResponse = Depends(get_current_user)):
    # Get all students for this tesorero
    students = await db.students.find({"tesorero_id": current_user.id}).to_list(1000)
    student_ids = [student["id"] for student in students]
    
    # Calculate total income from payments
    payments = await db.payments.find({"student_id": {"$in": student_ids}, "paid": True}).to_list(1000)
    total_income = sum(payment["amount"] for payment in payments)
    
    # Calculate total expenses
    expenses = await db.expenses.find({"tesorero_id": current_user.id}).to_list(1000)
    total_expenses = sum(expense["amount"] for expense in expenses)
    
    # Get payment settings to calculate pending payments
    settings = await db.payment_settings.find_one({"tesorero_id": current_user.id})
    pending_payments = 0
    if settings:
        total_expected_payments = len(students) * len(settings["selected_months"])
        actual_payments = len(payments)
        pending_payments = max(0, total_expected_payments - actual_payments)
    
    return DashboardSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        current_balance=total_income - total_expenses,
        total_students=len(students),
        pending_payments=pending_payments
    )

# Public routes (no authentication required)
@api_router.get("/public/student/{cedula}", response_model=Optional[PublicStudentInfo])
async def get_public_student_info(cedula: str):
    student = await db.students.find_one({"cedula": cedula})
    if not student:
        return None
    
    # Get payments for this student
    payments = await db.payments.find({"student_id": student["id"], "paid": True}).to_list(1000)
    parsed_payments = [MonthlyPayment(**parse_from_mongo(payment)) for payment in payments]
    
    total_paid = sum(payment.amount for payment in parsed_payments)
    
    return PublicStudentInfo(
        name=student["name"],
        cedula=student["cedula"],
        payments=parsed_payments,
        total_paid=total_paid
    )

@api_router.get("/public/paralelo/{tesorero_id}/summary")
async def get_public_paralelo_summary(tesorero_id: str):
    # Get tesorero info
    tesorero = await db.users.find_one({"id": tesorero_id})
    if not tesorero:
        raise HTTPException(status_code=404, detail="Paralelo not found")
    
    # Get students for this paralelo
    students = await db.students.find({"tesorero_id": tesorero_id}).to_list(1000)
    student_ids = [student["id"] for student in students]
    
    # Calculate totals
    payments = await db.payments.find({"student_id": {"$in": student_ids}, "paid": True}).to_list(1000)
    total_income = sum(payment["amount"] for payment in payments)
    
    expenses = await db.expenses.find({"tesorero_id": tesorero_id}).to_list(1000)
    total_expenses = sum(expense["amount"] for expense in expenses)
    
    # Get expenses with student names
    expenses_with_details = []
    for expense in expenses:
        student = await db.students.find_one({"id": expense["responsible_student_id"]})
        expense_detail = {
            "description": expense["description"],
            "amount": expense["amount"],
            "responsible_student": student["name"] if student else "N/A",
            "activity_image": expense.get("activity_image"),
            "created_at": expense["created_at"]
        }
        expenses_with_details.append(expense_detail)
    
    return {
        "paralelo_name": tesorero["paralelo_name"],
        "total_income": total_income,
        "total_expenses": total_expenses,
        "current_balance": total_income - total_expenses,
        "expenses": expenses_with_details
    }

# Image upload route
@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: UserResponse = Depends(get_current_user)):
    if file.content_type not in ["image/jpeg", "image/png", "image/gif"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Read file content and encode to base64
    content = await file.read()
    encoded_content = base64.b64encode(content).decode('utf-8')
    
    # Create data URL
    data_url = f"data:{file.content_type};base64,{encoded_content}"
    
    return {"image_url": data_url}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()