import requests
import sys
import json
from datetime import datetime

class AportesAPITester:
    def __init__(self, base_url="https://aula-pagos.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.student_ids = []
        self.payment_ids = []
        self.expense_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login with provided credentials"""
        success, response = self.run_test(
            "Login with tesorero1",
            "POST",
            "auth/login",
            200,
            data={"username": "tesorero1", "password": "password123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response.get('user', {})
            print(f"   User: {self.user_data.get('username')} - {self.user_data.get('paralelo_name')}")
            return True
        return False

    def test_get_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get current user info",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_student(self, name, cedula):
        """Create a test student"""
        success, response = self.run_test(
            f"Create student: {name}",
            "POST",
            "students",
            200,
            data={"name": name, "cedula": cedula}
        )
        if success and 'id' in response:
            self.student_ids.append(response['id'])
            return response['id']
        return None

    def test_get_students(self):
        """Get all students"""
        success, response = self.run_test(
            "Get all students",
            "GET",
            "students",
            200
        )
        if success:
            print(f"   Found {len(response)} students")
        return success

    def test_payment_settings(self):
        """Test payment settings creation and retrieval"""
        # Create payment settings
        settings_data = {
            "monthly_amount": 15.0,
            "selected_months": ["Enero", "Febrero", "Marzo", "Abril", "Mayo"],
            "academic_year": "2025"
        }
        
        success, response = self.run_test(
            "Create payment settings",
            "POST",
            "payment-settings",
            200,
            data=settings_data
        )
        
        if not success:
            return False
            
        # Get payment settings
        success, response = self.run_test(
            "Get payment settings",
            "GET",
            "payment-settings",
            200
        )
        return success

    def test_create_payment(self, student_id, month="Enero", year="2025", amount=15.0):
        """Create a payment for a student"""
        success, response = self.run_test(
            f"Create payment for student {student_id}",
            "POST",
            "payments",
            200,
            data={
                "student_id": student_id,
                "month": month,
                "year": year,
                "amount": amount
            }
        )
        if success and 'id' in response:
            self.payment_ids.append(response['id'])
            return response['id']
        return None

    def test_get_payments(self):
        """Get all payments"""
        success, response = self.run_test(
            "Get all payments",
            "GET",
            "payments",
            200
        )
        if success:
            print(f"   Found {len(response)} payments")
        return success

    def test_create_expense(self, student_id, description="Actividad escolar", amount=10.0):
        """Create an expense"""
        success, response = self.run_test(
            f"Create expense: {description}",
            "POST",
            "expenses",
            200,
            data={
                "responsible_student_id": student_id,
                "description": description,
                "amount": amount
            }
        )
        if success and 'id' in response:
            self.expense_ids.append(response['id'])
            return response['id']
        return None

    def test_get_expenses(self):
        """Get all expenses"""
        success, response = self.run_test(
            "Get all expenses",
            "GET",
            "expenses",
            200
        )
        if success:
            print(f"   Found {len(response)} expenses")
        return success

    def test_dashboard_summary(self):
        """Test dashboard summary"""
        success, response = self.run_test(
            "Get dashboard summary",
            "GET",
            "dashboard/summary",
            200
        )
        if success:
            print(f"   Income: ${response.get('total_income', 0)}")
            print(f"   Expenses: ${response.get('total_expenses', 0)}")
            print(f"   Balance: ${response.get('current_balance', 0)}")
            print(f"   Students: {response.get('total_students', 0)}")
            print(f"   Pending: {response.get('pending_payments', 0)}")
        return success

    def test_public_student_info(self, cedula):
        """Test public student information endpoint"""
        success, response = self.run_test(
            f"Get public info for cedula: {cedula}",
            "GET",
            f"public/student/{cedula}",
            200
        )
        if success and response:
            print(f"   Student: {response.get('name', 'N/A')}")
            print(f"   Total paid: ${response.get('total_paid', 0)}")
            print(f"   Payments: {len(response.get('payments', []))}")
        return success

    def test_delete_operations(self):
        """Test delete operations"""
        success_count = 0
        
        # Delete payments
        for payment_id in self.payment_ids:
            success, _ = self.run_test(
                f"Delete payment {payment_id}",
                "DELETE",
                f"payments/{payment_id}",
                200
            )
            if success:
                success_count += 1
        
        # Delete expenses
        for expense_id in self.expense_ids:
            success, _ = self.run_test(
                f"Delete expense {expense_id}",
                "DELETE",
                f"expenses/{expense_id}",
                200
            )
            if success:
                success_count += 1
        
        # Delete students
        for student_id in self.student_ids:
            success, _ = self.run_test(
                f"Delete student {student_id}",
                "DELETE",
                f"students/{student_id}",
                200
            )
            if success:
                success_count += 1
        
        return success_count > 0

def main():
    print("🚀 Starting Sistema de Gestión de Aportes API Tests")
    print("=" * 60)
    
    tester = AportesAPITester()
    
    # Test authentication
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
    
    if not tester.test_get_me():
        print("❌ Get user info failed")
        return 1
    
    # Test payment settings
    if not tester.test_payment_settings():
        print("❌ Payment settings failed")
        return 1
    
    # Test student management
    student1_id = tester.test_create_student("Juan Pérez", "1234567890")
    student2_id = tester.test_create_student("María González", "0987654321")
    
    if not student1_id or not student2_id:
        print("❌ Student creation failed")
        return 1
    
    if not tester.test_get_students():
        print("❌ Get students failed")
        return 1
    
    # Test payments
    payment1_id = tester.test_create_payment(student1_id, "Enero", "2025", 15.0)
    payment2_id = tester.test_create_payment(student2_id, "Febrero", "2025", 15.0)
    
    if not payment1_id or not payment2_id:
        print("❌ Payment creation failed")
        return 1
    
    if not tester.test_get_payments():
        print("❌ Get payments failed")
        return 1
    
    # Test expenses
    expense1_id = tester.test_create_expense(student1_id, "Material escolar", 8.0)
    expense2_id = tester.test_create_expense(student2_id, "Actividad deportiva", 12.0)
    
    if not expense1_id or not expense2_id:
        print("❌ Expense creation failed")
        return 1
    
    if not tester.test_get_expenses():
        print("❌ Get expenses failed")
        return 1
    
    # Test dashboard
    if not tester.test_dashboard_summary():
        print("❌ Dashboard summary failed")
        return 1
    
    # Test public endpoints
    if not tester.test_public_student_info("1234567890"):
        print("❌ Public student info failed")
        return 1
    
    # Test delete operations
    if not tester.test_delete_operations():
        print("❌ Delete operations failed")
        return 1
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())