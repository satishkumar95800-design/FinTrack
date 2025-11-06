from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from passlib.context import CryptContext
from jose import JWTError, jwt
import base64
import os
from dotenv import load_dotenv
import re

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
client = AsyncIOMotorClient(MONGO_URL)
db = client.budget_planner

# Collections
transactions_collection = db.transactions
categories_collection = db.categories
bills_collection = db.bills
upi_payments_collection = db.upi_payments
users_collection = db.users

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Models
class Transaction(BaseModel):
    type: str  # income or expense
    amount: float
    category: str
    description: str = ""
    date: str
    imageBase64: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class Bill(BaseModel):
    name: str
    amount: float
    dueDate: str
    isPaid: bool = False
    category: str = "Credit Card"
    reminderSet: bool = False
    source: str = "manual"  # manual, email, sms
    isRecurring: bool = False  # If true, auto-generate monthly
    recurringDay: Optional[int] = None  # Day of month (1-31) for recurring bills
    parentBillId: Optional[str] = None  # Reference to original recurring bill
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class UPIPayment(BaseModel):
    amount: float
    recipient: str
    upiId: str
    date: str
    status: str = "completed"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class Category(BaseModel):
    name: str
    type: str  # income or expense
    icon: str = "💰"
    color: str = "#4CAF50"

class ReceiptOCR(BaseModel):
    imageBase64: str

class SMSMessage(BaseModel):
    body: str
    date: str

class EmailMessage(BaseModel):
    subject: str
    body: str
    date: str

class User(BaseModel):
    email: EmailStr
    password: str
    name: str = "User"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str = "User"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordReset(BaseModel):
    currentPassword: str
    newPassword: str

class Token(BaseModel):
    access_token: str
    token_type: str

class SocialLogin(BaseModel):
    provider: str  # google or apple
    token: str
    email: EmailStr
    name: str

# Helper functions
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    
    try:
        if not authorization.startswith("Bearer "):
            return None
        
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        
        user = await users_collection.find_one({"email": email})
        return serialize_doc(user) if user else None
    except JWTError:
        return None

@app.on_event("startup")
async def startup_db_client():
    # Initialize default categories
    existing_categories = await categories_collection.count_documents({})
    if existing_categories == 0:
        default_categories = [
            {"name": "Salary", "type": "income", "icon": "💰", "color": "#4CAF50"},
            {"name": "Business", "type": "income", "icon": "💼", "color": "#2196F3"},
            {"name": "Food", "type": "expense", "icon": "🍔", "color": "#FF9800"},
            {"name": "Transport", "type": "expense", "icon": "🚗", "color": "#9C27B0"},
            {"name": "Shopping", "type": "expense", "icon": "🛒", "color": "#E91E63"},
            {"name": "Bills", "type": "expense", "icon": "📄", "color": "#F44336"},
            {"name": "Entertainment", "type": "expense", "icon": "🎬", "color": "#673AB7"},
            {"name": "Health", "type": "expense", "icon": "🏥", "color": "#00BCD4"},
        ]
        await categories_collection.insert_many(default_categories)

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Budget Planner API is running"}

# Authentication endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user: UserRegister):
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    user_data = {
        "email": user.email,
        "password": hashed_password,
        "name": user.name,
        "createdAt": datetime.utcnow().isoformat()
    }
    
    result = await users_collection.insert_one(user_data)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin):
    # Find user
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/logout")
async def logout():
    # With JWT, logout is handled client-side by removing the token
    return {"message": "Logged out successfully"}

@app.put("/api/auth/reset-password")
async def reset_password(
    password_data: PasswordReset,
    current_user = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify current password
    if not verify_password(password_data.currentPassword, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_hashed_password = get_password_hash(password_data.newPassword)
    await users_collection.update_one(
        {"email": current_user["email"]},
        {"$set": {"password": new_hashed_password}}
    )
    
    return {"message": "Password updated successfully"}

@app.get("/api/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Remove password from response
    user_data = dict(current_user)
    user_data.pop("password", None)
    return {"user": user_data}

@app.post("/api/auth/forgot-password")
async def forgot_password(user_login: UserLogin):
    # Check if user exists
    user = await users_collection.find_one({"email": user_login.email})
    
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a reset link will be sent"}
    
    # In production, send actual email with reset token
    # For now, just return success
    # TODO: Implement email sending with reset token
    
    return {"message": "Password reset instructions sent to your email"}

# Categories
@app.get("/api/categories")
async def get_categories():
    categories = await categories_collection.find().to_list(length=100)
    return {"categories": [serialize_doc(cat) for cat in categories]}

@app.post("/api/categories")
async def create_category(category: Category):
    result = await categories_collection.insert_one(category.dict())
    new_category = await categories_collection.find_one({"_id": result.inserted_id})
    return {"category": serialize_doc(new_category)}

# Transactions
@app.get("/api/transactions")
async def get_transactions(type: Optional[str] = None, month: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    if month:
        # Filter by month (YYYY-MM format)
        query["date"] = {"$regex": f"^{month}"}
    
    transactions = await transactions_collection.find(query).sort("date", -1).to_list(length=1000)
    return {"transactions": [serialize_doc(t) for t in transactions]}

@app.get("/api/transactions/{transaction_id}")
async def get_transaction(transaction_id: str):
    try:
        transaction = await transactions_collection.find_one({"_id": ObjectId(transaction_id)})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"transaction": serialize_doc(transaction)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/transactions")
async def create_transaction(transaction: Transaction):
    result = await transactions_collection.insert_one(transaction.dict())
    new_transaction = await transactions_collection.find_one({"_id": result.inserted_id})
    return {"transaction": serialize_doc(new_transaction)}

@app.put("/api/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, transaction: Transaction):
    try:
        result = await transactions_collection.update_one(
            {"_id": ObjectId(transaction_id)},
            {"$set": transaction.dict()}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        updated_transaction = await transactions_collection.find_one({"_id": ObjectId(transaction_id)})
        return {"transaction": serialize_doc(updated_transaction)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    try:
        result = await transactions_collection.delete_one({"_id": ObjectId(transaction_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Receipt OCR
@app.post("/api/ocr/receipt")
async def scan_receipt(receipt: ReceiptOCR):
    try:
        # Use Emergent LLM for OCR
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        # Create chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=f"receipt-{datetime.utcnow().timestamp()}",
            system_message="You are a receipt OCR assistant. Extract transaction details from receipt images."
        ).with_model("openai", "gpt-4o-mini")
        
        # Create image content
        image_content = ImageContent(image_base64=receipt.imageBase64)
        
        # Create message
        user_message = UserMessage(
            text="""Extract the following information from this receipt:
            1. Total amount (just the number)
            2. Merchant/store name
            3. Date (in YYYY-MM-DD format, if not visible use today's date)
            4. Category (choose from: Food, Transport, Shopping, Bills, Entertainment, Health, Other)
            
            Respond in this exact format:
            Amount: [number]
            Merchant: [name]
            Date: [YYYY-MM-DD]
            Category: [category]""",
            file_contents=[image_content]
        )
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Parse response
        amount_match = re.search(r'Amount:\s*([\d.]+)', response)
        merchant_match = re.search(r'Merchant:\s*(.+?)(?:\n|$)', response)
        date_match = re.search(r'Date:\s*(\d{4}-\d{2}-\d{2})', response)
        category_match = re.search(r'Category:\s*(.+?)(?:\n|$)', response)
        
        return {
            "amount": float(amount_match.group(1)) if amount_match else 0.0,
            "merchant": merchant_match.group(1).strip() if merchant_match else "Unknown",
            "date": date_match.group(1) if date_match else datetime.utcnow().strftime("%Y-%m-%d"),
            "category": category_match.group(1).strip() if category_match else "Other"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

# SMS Parsing
@app.post("/api/parse/sms")
async def parse_sms(sms: SMSMessage):
    try:
        # Use AI to parse SMS
        api_key = os.getenv("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"sms-{datetime.utcnow().timestamp()}",
            system_message="You are an SMS parser for banking transactions."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(
            text=f"""Parse this SMS and identify if it's a banking transaction (credit/debit):
            SMS: {sms.body}
            
            If it's a transaction, respond in this format:
            Type: [debit/credit]
            Amount: [number]
            Merchant: [name or N/A]
            Date: [YYYY-MM-DD]
            IsUPI: [yes/no]
            
            If it's not a banking transaction, respond with: NOT_TRANSACTION"""
        )
        
        response = await chat.send_message(user_message)
        
        if "NOT_TRANSACTION" in response:
            return {"isTransaction": False}
        
        # Parse response
        type_match = re.search(r'Type:\s*(debit|credit)', response, re.IGNORECASE)
        amount_match = re.search(r'Amount:\s*([\d.]+)', response)
        merchant_match = re.search(r'Merchant:\s*(.+?)(?:\n|$)', response)
        date_match = re.search(r'Date:\s*(\d{4}-\d{2}-\d{2})', response)
        is_upi_match = re.search(r'IsUPI:\s*(yes|no)', response, re.IGNORECASE)
        
        return {
            "isTransaction": True,
            "type": "expense" if type_match and type_match.group(1).lower() == "debit" else "income",
            "amount": float(amount_match.group(1)) if amount_match else 0.0,
            "merchant": merchant_match.group(1).strip() if merchant_match else "Unknown",
            "date": date_match.group(1) if date_match else sms.date,
            "isUPI": is_upi_match and is_upi_match.group(1).lower() == "yes",
            "category": "Bills"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SMS parsing failed: {str(e)}")

# Email Parsing
@app.post("/api/parse/email")
async def parse_email(email: EmailMessage):
    try:
        # Use AI to parse email for credit card bills
        api_key = os.getenv("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"email-{datetime.utcnow().timestamp()}",
            system_message="You are an email parser for credit card bills."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(
            text=f"""Parse this email and identify if it's a credit card bill:
            Subject: {email.subject}
            Body: {email.body[:500]}
            
            If it's a credit card bill, respond in this format:
            BillName: [bank name + credit card]
            Amount: [number]
            DueDate: [YYYY-MM-DD]
            
            If it's not a credit card bill, respond with: NOT_BILL"""
        )
        
        response = await chat.send_message(user_message)
        
        if "NOT_BILL" in response:
            return {"isBill": False}
        
        # Parse response
        bill_name_match = re.search(r'BillName:\s*(.+?)(?:\n|$)', response)
        amount_match = re.search(r'Amount:\s*([\d.]+)', response)
        due_date_match = re.search(r'DueDate:\s*(\d{4}-\d{2}-\d{2})', response)
        
        return {
            "isBill": True,
            "billName": bill_name_match.group(1).strip() if bill_name_match else "Credit Card Bill",
            "amount": float(amount_match.group(1)) if amount_match else 0.0,
            "dueDate": due_date_match.group(1) if due_date_match else (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email parsing failed: {str(e)}")

# Helper function to generate recurring bills
async def generate_recurring_bills():
    """Auto-generate recurring bills for the current month"""
    try:
        # Find all recurring bills (parent bills)
        recurring_bills = await bills_collection.find({"isRecurring": True, "parentBillId": None}).to_list(length=1000)
        
        current_month = datetime.utcnow().strftime("%Y-%m")
        
        for parent_bill in recurring_bills:
            # Check if bill for this month already exists
            existing_bill = await bills_collection.find_one({
                "parentBillId": str(parent_bill["_id"]),
                "dueDate": {"$regex": f"^{current_month}"}
            })
            
            if not existing_bill:
                # Generate new bill for this month
                recurring_day = parent_bill.get("recurringDay", 1)
                due_date = f"{current_month}-{recurring_day:02d}"
                
                new_bill = {
                    "name": parent_bill["name"],
                    "amount": parent_bill["amount"],
                    "dueDate": due_date,
                    "isPaid": False,
                    "category": parent_bill["category"],
                    "reminderSet": False,
                    "source": "recurring",
                    "isRecurring": False,
                    "recurringDay": None,
                    "parentBillId": str(parent_bill["_id"]),
                    "createdAt": datetime.utcnow().isoformat()
                }
                await bills_collection.insert_one(new_bill)
    except Exception as e:
        print(f"Error generating recurring bills: {str(e)}")

# Bills
@app.get("/api/bills")
async def get_bills(status: Optional[str] = None):
    # Auto-generate recurring bills for current month
    await generate_recurring_bills()
    
    query = {}
    if status == "unpaid":
        query["isPaid"] = False
    elif status == "paid":
        query["isPaid"] = True
    
    # Exclude parent recurring bills from the list (only show generated instances)
    query["$or"] = [
        {"isRecurring": False},
        {"isRecurring": True, "parentBillId": None}  # Include parent for management
    ]
    
    bills = await bills_collection.find(query).sort("dueDate", 1).to_list(length=1000)
    return {"bills": [serialize_doc(b) for b in bills]}

@app.post("/api/bills")
async def create_bill(bill: Bill):
    result = await bills_collection.insert_one(bill.dict())
    new_bill = await bills_collection.find_one({"_id": result.inserted_id})
    return {"bill": serialize_doc(new_bill)}

@app.put("/api/bills/{bill_id}")
async def update_bill(bill_id: str, bill: Bill):
    try:
        result = await bills_collection.update_one(
            {"_id": ObjectId(bill_id)},
            {"$set": bill.dict()}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bill not found")
        updated_bill = await bills_collection.find_one({"_id": ObjectId(bill_id)})
        return {"bill": serialize_doc(updated_bill)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/bills/{bill_id}")
async def delete_bill(bill_id: str):
    try:
        result = await bills_collection.delete_one({"_id": ObjectId(bill_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Bill not found")
        return {"message": "Bill deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# UPI Payments
@app.get("/api/upi-payments")
async def get_upi_payments():
    payments = await upi_payments_collection.find().sort("date", -1).to_list(length=1000)
    return {"payments": [serialize_doc(p) for p in payments]}

@app.post("/api/upi-payments")
async def create_upi_payment(payment: UPIPayment):
    result = await upi_payments_collection.insert_one(payment.dict())
    new_payment = await upi_payments_collection.find_one({"_id": result.inserted_id})
    return {"payment": serialize_doc(new_payment)}

# Analytics
@app.get("/api/analytics/summary")
async def get_summary(month: Optional[str] = None):
    query = {}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    transactions = await transactions_collection.find(query).to_list(length=10000)
    
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
    
    # Category breakdown
    category_breakdown = {}
    for t in transactions:
        if t["type"] == "expense":
            category = t["category"]
            category_breakdown[category] = category_breakdown.get(category, 0) + t["amount"]
    
    return {
        "totalIncome": total_income,
        "totalExpense": total_expense,
        "balance": total_income - total_expense,
        "categoryBreakdown": category_breakdown
    }

@app.get("/api/analytics/monthly-chart")
async def get_monthly_chart():
    # Get last 6 months data
    transactions = await transactions_collection.find().to_list(length=10000)
    
    monthly_data = {}
    for t in transactions:
        month = t["date"][:7]  # YYYY-MM
        if month not in monthly_data:
            monthly_data[month] = {"income": 0, "expense": 0}
        
        if t["type"] == "income":
            monthly_data[month]["income"] += t["amount"]
        else:
            monthly_data[month]["expense"] += t["amount"]
    
    # Sort by month and get last 6
    sorted_months = sorted(monthly_data.keys(), reverse=True)[:6]
    sorted_months.reverse()
    
    chart_data = []
    for month in sorted_months:
        chart_data.append({
            "month": month,
            "income": monthly_data[month]["income"],
            "expense": monthly_data[month]["expense"]
        })
    
    return {"data": chart_data}

@app.get("/api/analytics/amount-required")
async def get_amount_required():
    """Calculate amount required: recurring bills (unpaid) + current month expenses - paid bills"""
    try:
        current_month = datetime.utcnow().strftime("%Y-%m")
        
        # Get current month transactions (expenses only)
        transactions = await transactions_collection.find({
            "date": {"$regex": f"^{current_month}"},
            "type": "expense"
        }).to_list(length=10000)
        
        current_month_expenses = sum(t["amount"] for t in transactions)
        
        # Get all bills for current month
        bills = await bills_collection.find({
            "dueDate": {"$regex": f"^{current_month}"}
        }).to_list(length=1000)
        
        unpaid_bills = sum(b["amount"] for b in bills if not b.get("isPaid", False))
        paid_bills = sum(b["amount"] for b in bills if b.get("isPaid", False))
        
        # Get recurring bills (parent bills)
        recurring_bills = await bills_collection.find({
            "isRecurring": True,
            "parentBillId": None
        }).to_list(length=1000)
        
        recurring_unpaid = 0
        for rb in recurring_bills:
            # Check if this month's instance is paid
            month_bill = await bills_collection.find_one({
                "parentBillId": str(rb["_id"]),
                "dueDate": {"$regex": f"^{current_month}"}
            })
            if month_bill and not month_bill.get("isPaid", False):
                recurring_unpaid += month_bill["amount"]
            elif not month_bill:
                # Not yet generated for this month, count it
                recurring_unpaid += rb["amount"]
        
        # Amount Required = Recurring Bills (unpaid) + Current Month Expenses - Paid Bills
        amount_required = current_month_expenses + unpaid_bills
        
        return {
            "amountRequired": amount_required,
            "currentMonthExpenses": current_month_expenses,
            "unpaidBills": unpaid_bills,
            "paidBills": paid_bills,
            "recurringUnpaid": recurring_unpaid,
            "currentMonth": current_month
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Amount required calculation failed: {str(e)}")

@app.get("/api/analytics/pocket-money")
async def get_pocket_money():
    """Calculate pocket money: income - recurring bills - current month bills - other expenses"""
    try:
        current_month = datetime.utcnow().strftime("%Y-%m")
        current_date = datetime.utcnow().date()
        days_in_month = (datetime.utcnow().replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        total_days = days_in_month.day
        days_passed = current_date.day
        days_remaining = total_days - days_passed + 1
        
        # Get total income for current month
        transactions = await transactions_collection.find({
            "date": {"$regex": f"^{current_month}"}
        }).to_list(length=10000)
        
        total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
        total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
        
        # Get current month bills (paid and unpaid)
        bills = await bills_collection.find({
            "dueDate": {"$regex": f"^{current_month}"}
        }).to_list(length=1000)
        
        total_bills = sum(b["amount"] for b in bills)
        paid_bills = sum(b["amount"] for b in bills if b.get("isPaid", False))
        unpaid_bills = total_bills - paid_bills
        
        # Get recurring bills amount (estimate for future months)
        recurring_bills = await bills_collection.find({
            "isRecurring": True,
            "parentBillId": None
        }).to_list(length=1000)
        
        total_recurring = sum(b["amount"] for b in recurring_bills)
        
        # Calculate pocket money
        pocket_money = total_income - total_expense - unpaid_bills
        
        # Calculate daily spendable amount
        daily_spendable = pocket_money / days_remaining if days_remaining > 0 else 0
        
        return {
            "pocketMoney": max(0, pocket_money),
            "dailySpendable": max(0, daily_spendable),
            "daysRemaining": days_remaining,
            "totalIncome": total_income,
            "totalExpense": total_expense,
            "totalBills": total_bills,
            "paidBills": paid_bills,
            "unpaidBills": unpaid_bills,
            "recurringBillsMonthly": total_recurring,
            "currentMonth": current_month
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pocket money calculation failed: {str(e)}")

@app.get("/api/analytics/ai-insights")
async def get_ai_insights():
    """Get AI-powered financial insights and recommendations"""
    try:
        current_month = datetime.utcnow().strftime("%Y-%m")
        
        # Get last 3 months of data for better analysis
        three_months_ago = (datetime.utcnow() - timedelta(days=90)).strftime("%Y-%m")
        
        # Fetch all relevant data
        transactions = await transactions_collection.find({
            "date": {"$gte": three_months_ago}
        }).to_list(length=10000)
        
        bills = await bills_collection.find().to_list(length=1000)
        
        # Calculate key metrics
        total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
        total_expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
        
        # Get recurring bills (loans/EMIs)
        recurring_bills = [b for b in bills if b.get("isRecurring", False)]
        loan_bills = [b for b in recurring_bills if any(keyword in b["name"].lower() for keyword in ["loan", "emi", "credit"])]
        
        # Calculate monthly averages
        months_data = {}
        for t in transactions:
            month = t["date"][:7]
            if month not in months_data:
                months_data[month] = {"income": 0, "expense": 0}
            if t["type"] == "income":
                months_data[month]["income"] += t["amount"]
            else:
                months_data[month]["expense"] += t["amount"]
        
        avg_monthly_income = sum(m["income"] for m in months_data.values()) / len(months_data) if months_data else 0
        avg_monthly_expense = sum(m["expense"] for m in months_data.values()) / len(months_data) if months_data else 0
        
        # Category-wise spending
        category_spending = {}
        for t in transactions:
            if t["type"] == "expense":
                cat = t.get("category", "Other")
                category_spending[cat] = category_spending.get(cat, 0) + t["amount"]
        
        # Prepare data for AI analysis
        analysis_data = {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "avg_monthly_income": avg_monthly_income,
            "avg_monthly_expense": avg_monthly_expense,
            "monthly_savings": avg_monthly_income - avg_monthly_expense,
            "loan_bills": [{"name": b["name"], "amount": b["amount"]} for b in loan_bills],
            "recurring_bills": [{"name": b["name"], "amount": b["amount"]} for b in recurring_bills],
            "category_spending": category_spending,
            "months_count": len(months_data)
        }
        
        # Use AI to generate insights
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ai-insights-{datetime.utcnow().timestamp()}",
            system_message="You are a professional financial advisor AI. Analyze user's financial data and provide actionable insights."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""Analyze this financial data and provide comprehensive insights:

Income & Expenses:
- Average Monthly Income: ₹{avg_monthly_income:.2f}
- Average Monthly Expense: ₹{avg_monthly_expense:.2f}
- Monthly Savings: ₹{analysis_data['monthly_savings']:.2f}

Loans/EMIs:
{chr(10).join([f"- {loan['name']}: ₹{loan['amount']}/month" for loan in analysis_data['loan_bills']]) if analysis_data['loan_bills'] else "- No loans detected"}

Category-wise Spending:
{chr(10).join([f"- {cat}: ₹{amt:.2f}" for cat, amt in sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:5]])}

Provide analysis in this EXACT JSON format:
{{
  "loan_payoff_strategy": {{
    "current_timeline": "Estimated months to clear all loans at current rate",
    "accelerated_timeline": "Months if paying 20% extra each month",
    "recommendation": "Specific action to finish loans faster"
  }},
  "savings_opportunities": [
    {{"category": "Category name", "current": 5000, "suggested": 3000, "savings": 2000, "tip": "How to save"}},
    {{"category": "Another category", "current": 3000, "suggested": 2000, "savings": 1000, "tip": "Another tip"}}
  ],
  "spending_insights": [
    "Key insight about spending pattern 1",
    "Key insight about spending pattern 2"
  ],
  "financial_health_score": 75,
  "top_recommendations": [
    "Most important action user should take",
    "Second important action",
    "Third important action"
  ],
  "future_projection": {{
    "6_months": "Financial situation in 6 months",
    "1_year": "Financial situation in 1 year"
  }}
}}

Be specific with numbers and actionable. Focus on Indian context (₹)."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        # Extract JSON from response (handle markdown code blocks)
        json_str = response
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            json_str = response.split("```")[1].split("```")[0].strip()
        
        try:
            insights = json.loads(json_str)
        except:
            # Fallback if JSON parsing fails
            insights = {
                "loan_payoff_strategy": {
                    "current_timeline": "Analysis pending",
                    "accelerated_timeline": "Analysis pending",
                    "recommendation": response[:200]
                },
                "savings_opportunities": [],
                "spending_insights": ["AI analysis in progress"],
                "financial_health_score": 70,
                "top_recommendations": ["Continue tracking expenses", "Review spending patterns"],
                "future_projection": {
                    "6_months": "Steady progress expected",
                    "1_year": "Financial improvement likely"
                }
            }
        
        return {
            "insights": insights,
            "data_summary": analysis_data,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI insights generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)