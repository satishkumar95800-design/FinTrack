#!/usr/bin/env python3
"""
Backend API Testing Suite for Budget Planner App
Tests all backend endpoints with realistic data
"""

import requests
import json
import base64
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend env
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://expense-tracker-1322.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing Backend API at: {API_BASE}")

# Test data
test_transaction_data = {
    "type": "expense",
    "amount": 45.50,
    "category": "Food",
    "description": "Lunch at Italian restaurant",
    "date": "2024-01-15"
}

test_bill_data = {
    "name": "Chase Credit Card",
    "amount": 1250.75,
    "dueDate": "2024-02-15",
    "isPaid": False,
    "category": "Credit Card",
    "reminderSet": True,
    "source": "email"
}

test_upi_payment_data = {
    "amount": 150.00,
    "recipient": "John's Coffee Shop",
    "upiId": "johnscoffee@paytm",
    "date": "2024-01-15",
    "status": "completed"
}

# Sample base64 image for OCR testing (small 1x1 pixel PNG)
sample_receipt_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

# Sample SMS messages for parsing
sample_sms_messages = [
    {
        "body": "Your account XXXX1234 has been debited by Rs.250.00 on 15-Jan-24 at STARBUCKS COFFEE. Available balance: Rs.5,750.00",
        "date": "2024-01-15"
    },
    {
        "body": "Rs.1000.00 credited to your account XXXX5678 on 15-Jan-24. Salary credit from ABC CORP. Available balance: Rs.15,750.00",
        "date": "2024-01-15"
    },
    {
        "body": "UPI payment of Rs.75.00 to merchant@paytm successful. Ref: 402315789456. Balance: Rs.4,925.00",
        "date": "2024-01-15"
    }
]

# Sample email for credit card bill parsing
sample_email = {
    "subject": "Your Chase Credit Card Statement is Ready",
    "body": """Dear Customer,
    
Your Chase Sapphire Credit Card statement for December 2023 is now available.

Statement Summary:
Previous Balance: $1,200.50
Payments/Credits: $1,200.50
New Purchases: $850.75
Finance Charges: $0.00
Current Balance: $850.75

Minimum Payment Due: $25.00
Payment Due Date: February 15, 2024

Please ensure your payment is received by the due date to avoid late fees.

Thank you for choosing Chase.
""",
    "date": "2024-01-20"
}

def test_health_check():
    """Test health check endpoint"""
    print("\n=== Testing Health Check ===")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_categories():
    """Test categories endpoint"""
    print("\n=== Testing Categories ===")
    try:
        response = requests.get(f"{API_BASE}/categories", timeout=10)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Categories count: {len(data.get('categories', []))}")
        if data.get('categories'):
            print(f"Sample category: {data['categories'][0]}")
        return response.status_code == 200 and len(data.get('categories', [])) > 0
    except Exception as e:
        print(f"Categories test failed: {e}")
        return False

def test_transactions_crud():
    """Test transactions CRUD operations"""
    print("\n=== Testing Transactions CRUD ===")
    transaction_id = None
    
    try:
        # Test POST (create transaction)
        print("Testing POST /api/transactions")
        response = requests.post(f"{API_BASE}/transactions", 
                               json=test_transaction_data, timeout=10)
        print(f"POST Status Code: {response.status_code}")
        if response.status_code == 200:
            transaction_data = response.json()
            transaction_id = transaction_data.get('transaction', {}).get('_id')
            print(f"Created transaction ID: {transaction_id}")
        else:
            print(f"POST failed: {response.text}")
            return False
        
        # Test GET (list transactions)
        print("\nTesting GET /api/transactions")
        response = requests.get(f"{API_BASE}/transactions", timeout=10)
        print(f"GET Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Transactions count: {len(data.get('transactions', []))}")
        else:
            print(f"GET failed: {response.text}")
            return False
        
        # Test GET single transaction
        if transaction_id:
            print(f"\nTesting GET /api/transactions/{transaction_id}")
            response = requests.get(f"{API_BASE}/transactions/{transaction_id}", timeout=10)
            print(f"GET single Status Code: {response.status_code}")
            if response.status_code != 200:
                print(f"GET single failed: {response.text}")
        
        # Test PUT (update transaction)
        if transaction_id:
            print(f"\nTesting PUT /api/transactions/{transaction_id}")
            updated_data = test_transaction_data.copy()
            updated_data["amount"] = 55.75
            updated_data["description"] = "Updated: Dinner at Italian restaurant"
            
            response = requests.put(f"{API_BASE}/transactions/{transaction_id}", 
                                  json=updated_data, timeout=10)
            print(f"PUT Status Code: {response.status_code}")
            if response.status_code != 200:
                print(f"PUT failed: {response.text}")
        
        # Test DELETE (delete transaction)
        if transaction_id:
            print(f"\nTesting DELETE /api/transactions/{transaction_id}")
            response = requests.delete(f"{API_BASE}/transactions/{transaction_id}", timeout=10)
            print(f"DELETE Status Code: {response.status_code}")
            if response.status_code == 200:
                print("Transaction deleted successfully")
                return True
            else:
                print(f"DELETE failed: {response.text}")
                return False
        
        return True
        
    except Exception as e:
        print(f"Transactions CRUD test failed: {e}")
        return False

def test_receipt_ocr():
    """Test receipt OCR with AI"""
    print("\n=== Testing Receipt OCR ===")
    try:
        ocr_data = {"imageBase64": sample_receipt_image}
        response = requests.post(f"{API_BASE}/ocr/receipt", 
                               json=ocr_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"OCR Result: {data}")
            # Check if required fields are present
            required_fields = ['amount', 'merchant', 'date', 'category']
            has_all_fields = all(field in data for field in required_fields)
            print(f"Has all required fields: {has_all_fields}")
            return has_all_fields
        else:
            print(f"OCR failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"Receipt OCR test failed: {e}")
        return False

def test_sms_parsing():
    """Test SMS parsing with AI"""
    print("\n=== Testing SMS Parsing ===")
    success_count = 0
    
    for i, sms_data in enumerate(sample_sms_messages):
        print(f"\nTesting SMS {i+1}: {sms_data['body'][:50]}...")
        try:
            response = requests.post(f"{API_BASE}/parse/sms", 
                                   json=sms_data, timeout=30)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"SMS Parse Result: {data}")
                if data.get('isTransaction'):
                    required_fields = ['type', 'amount', 'merchant', 'date']
                    has_required = all(field in data for field in required_fields)
                    if has_required:
                        success_count += 1
                        print("✓ SMS parsed successfully")
                    else:
                        print("✗ Missing required fields in response")
                else:
                    print("SMS identified as non-transaction")
            else:
                print(f"SMS parsing failed: {response.text}")
                
        except Exception as e:
            print(f"SMS {i+1} parsing failed: {e}")
    
    print(f"\nSMS Parsing Summary: {success_count}/{len(sample_sms_messages)} successful")
    return success_count > 0

def test_email_parsing():
    """Test email parsing for credit card bills"""
    print("\n=== Testing Email Parsing ===")
    try:
        response = requests.post(f"{API_BASE}/parse/email", 
                               json=sample_email, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Email Parse Result: {data}")
            
            if data.get('isBill'):
                required_fields = ['billName', 'amount', 'dueDate']
                has_required = all(field in data for field in required_fields)
                print(f"Has all required fields: {has_required}")
                return has_required
            else:
                print("Email not identified as bill")
                return False
        else:
            print(f"Email parsing failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"Email parsing test failed: {e}")
        return False

def test_bills_crud():
    """Test bills CRUD operations"""
    print("\n=== Testing Bills CRUD ===")
    bill_id = None
    
    try:
        # Test POST (create bill)
        print("Testing POST /api/bills")
        response = requests.post(f"{API_BASE}/bills", 
                               json=test_bill_data, timeout=10)
        print(f"POST Status Code: {response.status_code}")
        if response.status_code == 200:
            bill_data = response.json()
            bill_id = bill_data.get('bill', {}).get('_id')
            print(f"Created bill ID: {bill_id}")
        else:
            print(f"POST failed: {response.text}")
            return False
        
        # Test GET (list bills)
        print("\nTesting GET /api/bills")
        response = requests.get(f"{API_BASE}/bills", timeout=10)
        print(f"GET Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Bills count: {len(data.get('bills', []))}")
        else:
            print(f"GET failed: {response.text}")
            return False
        
        # Test GET unpaid bills
        print("\nTesting GET /api/bills?status=unpaid")
        response = requests.get(f"{API_BASE}/bills?status=unpaid", timeout=10)
        print(f"GET unpaid Status Code: {response.status_code}")
        
        # Test PUT (update bill)
        if bill_id:
            print(f"\nTesting PUT /api/bills/{bill_id}")
            updated_bill = test_bill_data.copy()
            updated_bill["isPaid"] = True
            updated_bill["amount"] = 1300.00
            
            response = requests.put(f"{API_BASE}/bills/{bill_id}", 
                                  json=updated_bill, timeout=10)
            print(f"PUT Status Code: {response.status_code}")
            if response.status_code != 200:
                print(f"PUT failed: {response.text}")
        
        # Test DELETE (delete bill)
        if bill_id:
            print(f"\nTesting DELETE /api/bills/{bill_id}")
            response = requests.delete(f"{API_BASE}/bills/{bill_id}", timeout=10)
            print(f"DELETE Status Code: {response.status_code}")
            if response.status_code == 200:
                print("Bill deleted successfully")
                return True
            else:
                print(f"DELETE failed: {response.text}")
                return False
        
        return True
        
    except Exception as e:
        print(f"Bills CRUD test failed: {e}")
        return False

def test_upi_payments():
    """Test UPI payments endpoints"""
    print("\n=== Testing UPI Payments ===")
    
    try:
        # Test POST (create UPI payment)
        print("Testing POST /api/upi-payments")
        response = requests.post(f"{API_BASE}/upi-payments", 
                               json=test_upi_payment_data, timeout=10)
        print(f"POST Status Code: {response.status_code}")
        if response.status_code == 200:
            payment_data = response.json()
            print(f"Created UPI payment: {payment_data.get('payment', {}).get('_id')}")
        else:
            print(f"POST failed: {response.text}")
            return False
        
        # Test GET (list UPI payments)
        print("\nTesting GET /api/upi-payments")
        response = requests.get(f"{API_BASE}/upi-payments", timeout=10)
        print(f"GET Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"UPI Payments count: {len(data.get('payments', []))}")
            return True
        else:
            print(f"GET failed: {response.text}")
            return False
        
    except Exception as e:
        print(f"UPI Payments test failed: {e}")
        return False

def test_analytics():
    """Test analytics endpoints"""
    print("\n=== Testing Analytics ===")
    
    try:
        # Test summary endpoint
        print("Testing GET /api/analytics/summary")
        response = requests.get(f"{API_BASE}/analytics/summary", timeout=10)
        print(f"Summary Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Summary data: {data}")
            required_fields = ['totalIncome', 'totalExpense', 'balance', 'categoryBreakdown']
            has_required = all(field in data for field in required_fields)
            print(f"Has all required summary fields: {has_required}")
        else:
            print(f"Summary failed: {response.text}")
            return False
        
        # Test monthly chart endpoint
        print("\nTesting GET /api/analytics/monthly-chart")
        response = requests.get(f"{API_BASE}/analytics/monthly-chart", timeout=10)
        print(f"Monthly Chart Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Monthly chart data points: {len(data.get('data', []))}")
            if data.get('data'):
                print(f"Sample data point: {data['data'][0] if data['data'] else 'None'}")
            return True
        else:
            print(f"Monthly chart failed: {response.text}")
            return False
        
    except Exception as e:
        print(f"Analytics test failed: {e}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("BUDGET PLANNER BACKEND API TESTING")
    print("=" * 60)
    
    test_results = {}
    
    # Run all tests
    test_results['health_check'] = test_health_check()
    test_results['categories'] = test_categories()
    test_results['transactions_crud'] = test_transactions_crud()
    test_results['receipt_ocr'] = test_receipt_ocr()
    test_results['sms_parsing'] = test_sms_parsing()
    test_results['email_parsing'] = test_email_parsing()
    test_results['bills_crud'] = test_bills_crud()
    test_results['upi_payments'] = test_upi_payments()
    test_results['analytics'] = test_analytics()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests passed!")
    else:
        print("⚠️  Some tests failed. Check logs above for details.")
    
    return test_results

if __name__ == "__main__":
    main()