# Postman Testing Guide - JWT Authentication System

## Quick Start (3 Steps)

### Step 1: Import Collection into Postman

1. Open Postman (download from https://www.postman.com/downloads/)
2. Click Import button (top left)
3. Drag and drop postman-collection.json file
4. Click Import

### Step 2: Verify Your Backend is Running

- Backend must be running on: http://localhost:8081
- To start: Type .\dev.bat from C:\LOGIN_PAGE

### Step 3: Start Testing

Follow the test order below.

---

## Testing Workflow (In Order)

### 1. Health Checks (No Authentication Required)

#### Test 1: Check MongoDB Connection

```
GET http://localhost:8081/api/health/mongodb
```

Expected Response:

```json
{
  "status": "Connected",
  "database": "auth_system",
  "totalUsers": 0,
  "collections": ["users"],
  "message": "MongoDB is successfully connected!"
}
```

#### Test 2: List All Users

```
GET http://localhost:8081/api/health/users
```

Expected Response:

```json
{
  "totalUsers": 0,
  "users": []
}
```

---

### 2. User Registration (Create Test Users)

#### Register Student

```
POST http://localhost:8081/api/auth/register
Content-Type: application/json

{
    "email": "student@test.com",
    "password": "Student123",
    "fullName": "John Student",
    "role": "STUDENT",
    "phone": "1234567890"
}
```

Expected Response:

```
User registered successfully
```

#### Register Instructor

```
POST http://localhost:8081/api/auth/register
Content-Type: application/json

{
    "email": "instructor@test.com",
    "password": "Instructor123",
    "fullName": "Jane Instructor",
    "role": "INSTRUCTOR",
    "phone": "0987654321"
}
```

#### Register Admin

```
POST http://localhost:8081/api/auth/register
Content-Type: application/json

{
    "email": "admin@test.com",
    "password": "Admin123",
    "fullName": "Admin User",
    "role": "ADMIN",
    "phone": "5555555555"
}
```

After Registration:

- Re-run "List All Users" to see registered users
- Check MongoDB Compass: mongodb://localhost:27017/auth_system

---

### 3. User Login (Get JWT Token)

#### Login as Student

```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
    "email": "student@test.com",
    "password": "Student123"
}
```

Expected Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdHVkZW50QHRlc3QuY29tIiwicm9sZSI6IlNUVURFTlQiLCJmdWxsTmFtZSI6IkpvaG4gU3R1ZGVudCIsImlhdCI6MTczMDIwMDgwMCwiZXhwIjoxNzMwMjg3MjAwfQ.xyz...",
  "role": "STUDENT",
  "email": "student@test.com",
  "fullName": "John Student"
}
```

IMPORTANT: Copy the token value - you will need it for protected endpoints.

Note: The collection automatically saves the JWT token to {{jwt_token}} variable. Check Postman Console to see the saved token.

---

### 4. Validate Token (Verify JWT)

#### Validate Token

```
GET http://localhost:8081/api/auth/validate
Authorization: Bearer {{jwt_token}}
```

Expected Response:

```
STUDENT
```

How to Add Authorization Header in Postman:

1. Click Authorization tab
2. Select Type: Bearer Token
3. Token: {{jwt_token}} (uses saved variable)
4. Or paste actual token value

---

### 5. Role-Based Access Testing

#### Test Student Dashboard (Should Work)

```
GET http://localhost:8081/api/student/dashboard
Authorization: Bearer {{jwt_token}}
```

Expected Response:

```json
{
  "message": "Welcome to Student Dashboard",
  "role": "STUDENT",
  "features": [
    "View Courses",
    "Submit Assignments",
    "Track Progress",
    "Access Learning Materials"
  ]
}
```

#### Test Instructor Dashboard (Should Fail - Wrong Role)

```
GET http://localhost:8081/api/instructor/dashboard
Authorization: Bearer {{jwt_token}}
```

Expected Response: 403 Forbidden

#### Test Admin Dashboard (Should Fail - Wrong Role)

```
GET http://localhost:8081/api/admin/dashboard
Authorization: Bearer {{jwt_token}}
```

Expected Response: 403 Forbidden

---

### 6. Switch Roles (Test Different Users)

#### Login as Instructor

```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
    "email": "instructor@test.com",
    "password": "Instructor123"
}
```

Copy new token and now test /api/instructor/\* endpoints

#### Login as Admin

```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
    "email": "admin@test.com",
    "password": "Admin123"
}
```

Copy new token and now test /api/admin/\* endpoints

---

## Complete API Endpoint Reference

### Public Endpoints (No Authentication)

| Method | Endpoint              | Description              |
| ------ | --------------------- | ------------------------ |
| GET    | `/api/health/mongodb` | Check MongoDB connection |
| GET    | `/api/health/users`   | List all users           |
| POST   | `/api/auth/register`  | Register new user        |
| POST   | `/api/auth/login`     | Login and get JWT token  |

### Protected Endpoints (Requires JWT)

| Method | Endpoint                    | Required Role | Description          |
| ------ | --------------------------- | ------------- | -------------------- |
| GET    | `/api/auth/validate`        | Any           | Validate JWT token   |
| GET    | `/api/student/dashboard`    | STUDENT       | Student dashboard    |
| GET    | `/api/student/courses`      | STUDENT       | Student courses      |
| GET    | `/api/instructor/dashboard` | INSTRUCTOR    | Instructor dashboard |
| GET    | `/api/instructor/courses`   | INSTRUCTOR    | Instructor courses   |
| GET    | `/api/admin/dashboard`      | ADMIN         | Admin dashboard      |
| GET    | `/api/admin/users`          | ADMIN         | User statistics      |

---

## Postman Variables (Auto-Managed)

The collection uses these variables:

| Variable       | Description        | Example Value           |
| -------------- | ------------------ | ----------------------- |
| {{base_url}}   | Backend URL        | http://localhost:8081   |
| {{jwt_token}}  | Current JWT token  | eyJhbGciOiJIUzI1NiJ9... |
| {{user_email}} | Current user email | student@test.com        |
| {{user_role}}  | Current user role  | STUDENT                 |

Auto-Save: Login requests automatically save the JWT token to {{jwt_token}}.

---

## Test Scenarios

### Scenario 1: Student Access Control

1. Login as Student
2. Access /api/student/dashboard - Success
3. Access /api/instructor/dashboard - 403 Forbidden
4. Access /api/admin/dashboard - 403 Forbidden

### Scenario 2: Instructor Access Control

1. Login as Instructor
2. Access /api/student/dashboard - 403 Forbidden
3. Access /api/instructor/dashboard - Success
4. Access /api/admin/dashboard - 403 Forbidden

### Scenario 3: Admin Full Access

1. Login as Admin
2. Access /api/student/dashboard - 403 Forbidden
3. Access /api/instructor/dashboard - 403 Forbidden
4. Access /api/admin/dashboard - Success
5. Access /api/admin/users - Success

### Scenario 4: Token Expiration

1. Login and save token
2. Wait 24 hours (token expiry time)
3. Try accessing protected endpoint - 401 Unauthorized
4. Login again to get new token

### Scenario 5: Invalid Token

1. Use wrong token: Bearer invalid_token_12345
2. Try accessing protected endpoint - 401 Unauthorized

---

## Common Issues and Solutions

### Issue 1: "Connection Refused"

Problem: Backend not running  
Solution: Run .\dev.bat from C:\LOGIN_PAGE

### Issue 2: "401 Unauthorized"

Problem: JWT token missing or invalid  
Solution:

- Click Authorization tab
- Select Bearer Token
- Paste token value
- Or use {{jwt_token}} variable

### Issue 3: "403 Forbidden"

Problem: Wrong role trying to access endpoint  
Solution:

- Login with correct role
- Student can only access /api/student/\*
- Instructor can only access /api/instructor/\*
- Admin can only access /api/admin/\*

### Issue 4: "User already exists"

Problem: Trying to register duplicate email  
Solution: Use different email or delete user from MongoDB

### Issue 5: "Invalid email or password"

Problem: Wrong credentials  
Solution: Check email/password in login request body

---

## MongoDB Compass Verification

Connect to MongoDB:

```
mongodb://localhost:27017/auth_system
```

Check Users Collection:

- Database: auth_system
- Collection: users
- Fields: \_id, email, password (hashed), fullName, role, phone, enabled

---

## JWT Token Explained

### Token Structure

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdHVkZW50QHRlc3QuY29tIiwicm9sZSI6IlNUVURFTlQiLCJmdWxsTmFtZSI6IkpvaG4gU3R1ZGVudCIsImlhdCI6MTczMDIwMDgwMCwiZXhwIjoxNzMwMjg3MjAwfQ.signature_here
```

Parts:

1. Header (Algorithm): eyJhbGciOiJIUzI1NiJ9
2. Payload (Claims): eyJzdWIiOiJzdHVk... - Contains email, role, fullName, exp
3. Signature: signature_here - Verification hash

Decode Token: Use https://jwt.io to decode and inspect token claims

### Token Claims

```json
{
  "sub": "student@test.com",
  "role": "STUDENT",
  "fullName": "John Student",
  "iat": 1730200800,
  "exp": 1730287200
}
```

- sub: Subject (user email)
- role: User role (STUDENT/INSTRUCTOR/ADMIN)
- fullName: User's full name
- iat: Issued at (timestamp)
- exp: Expiration time (24 hours later)

---

## Quick Test Checklist

- [ ] MongoDB connection test passed
- [ ] Registered 3 users (student, instructor, admin)
- [ ] Verified users in MongoDB Compass
- [ ] Login as student - token received
- [ ] Student can access student dashboard
- [ ] Student CANNOT access instructor dashboard (403)
- [ ] Student CANNOT access admin dashboard (403)
- [ ] Login as instructor - token received
- [ ] Instructor can access instructor dashboard
- [ ] Login as admin - token received
- [ ] Admin can access admin dashboard
- [ ] Token validation works
- [ ] Invalid token returns 401

---

## Next Steps

1. Import Collection - postman-collection.json
2. Start Backend - .\dev.bat
3. Test Health - MongoDB connection
4. Register Users - 3 different roles
5. Login and Test - Role-based access
6. Verify MongoDB - Check users in Compass

---

## Support

If you encounter issues:

1. Check if backend is running on port 8081
2. Check if MongoDB is running on port 27017
3. Verify JWT token is properly set in Authorization header
4. Check Postman Console for auto-saved variables
