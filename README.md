# JWT Authentication System with Role-Based Dashboards

A full-stack authentication system built with **Spring Boot**, **Angular**, and **MongoDB** featuring JWT-based authentication and role-based access control (RBAC) with three distinct dashboards.

## Features

- **User Authentication**: Secure registration and login system
- **JWT Token Management**: Stateless authentication with JWT tokens
- **Role-Based Access Control**: Three user roles with dedicated dashboards
  - **Student Dashboard**: Course enrollment, learning progress, assignments
  - **Instructor Dashboard**: Course management, student management, analytics
  - **Admin Dashboard**: User management, system configuration, platform oversight
- **Modern UI**: Responsive design with gradient themes and smooth animations
- **Secure API**: Protected endpoints with JWT validation

## Tech Stack

### Backend

- **Spring Boot 3.2.0**
- **Java 17**
- **MongoDB** (NoSQL Database)
- **Spring Security** (Authentication & Authorization)
- **JWT (JSON Web Tokens)** (io.jsonwebtoken)
- **Maven** (Build Tool)

### Frontend

- **Angular 17**
- **TypeScript**
- **RxJS** (Reactive Programming)
- **Angular Router** (Navigation)
- **Angular Forms** (Template-driven & Reactive)

## Project Structure

```
LOGIN_PAGE/
├── backend/
│   ├── src/main/java/com/example/auth/
│   │   ├── controller/
│   │   │   ├── AuthController.java (Login/Register)
│   │   │   ├── StudentController.java
│   │   │   ├── InstructorController.java
│   │   │   └── AdminController.java
│   │   ├── model/
│   │   │   ├── User.java
│   │   │   ├── LoginRequest.java
│   │   │   ├── RegisterRequest.java
│   │   │   └── AuthResponse.java
│   │   ├── repository/
│   │   │   └── UserRepository.java
│   │   ├── security/
│   │   │   ├── JwtUtil.java
│   │   │   ├── JwtFilter.java
│   │   │   └── SecurityConfig.java
│   │   ├── service/
│   │   │   └── AuthService.java
│   │   └── AuthSystemApplication.java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
└── frontend/
    ├── src/app/
    │   ├── auth/
    │   │   ├── login/
    │   │   └── register/
    │   ├── dashboards/
    │   │   ├── student-dashboard/
    │   │   ├── instructor-dashboard/
    │   │   └── admin-dashboard/
    │   ├── guards/
    │   │   ├── auth.guard.ts
    │   │   └── role.guard.ts
    │   ├── services/
    │   │   └── auth.service.ts
    │   ├── app-routing.module.ts
    │   └── app.module.ts
    └── package.json
```

## Getting Started

### Prerequisites

- **Java 17** or higher
- **Maven 3.6+**
- **Node.js 18+** and **npm 9+**
- **MongoDB 6.0+** (running on `localhost:27017`)

### Backend Setup

1. **Navigate to backend directory:**

```powershell
cd C:\LOGIN_PAGE\backend
```

2. **Configure MongoDB connection:**
   Edit `src/main/resources/application.properties`:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/auth_system
```

3. **Build and run the Spring Boot application:**

```powershell
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory:**

```powershell
cd C:\LOGIN_PAGE\frontend
```

2. **Install dependencies:**

```powershell
npm install
```

3. **Start the Angular development server:**

```powershell
npm start
```

The frontend will start on `http://localhost:4200`

## API Endpoints

### Authentication APIs

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/validate` - Validate JWT token

### Student APIs (Role: STUDENT)

- `GET /api/student/dashboard` - Get student dashboard data
- `GET /api/student/courses` - Get enrolled courses

### Instructor APIs (Role: INSTRUCTOR)

- `GET /api/instructor/dashboard` - Get instructor dashboard data
- `GET /api/instructor/courses` - Get instructor's courses

### Admin APIs (Role: ADMIN)

- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/users` - Get all users

## Authentication Flow

1. User registers with email, password, name, role, and phone
2. User logs in with email and password
3. Backend validates credentials and generates JWT token
4. JWT token contains user email, role, and fullName
5. Frontend stores token in localStorage
6. All subsequent requests include JWT token in Authorization header
7. Backend validates token and authorizes based on role
8. Users are redirected to role-specific dashboards

## User Roles

### Student (STUDENT)

- Access to learning dashboard
- View enrolled courses
- Track progress and assignments
- View grades and achievements

### Instructor (INSTRUCTOR)

- Upload and manage courses
- Manage enrolled students
- Create and grade assignments
- View course analytics

### Admin (ADMIN)

- Manage all users (students, instructors, admins)
- Approve and manage all courses
- Configure platform settings
- View system-wide analytics and reports

## Security Features

- **Password Encryption**: BCrypt hashing
- **JWT Token**: Secure stateless authentication
- **CORS Configuration**: Configured for Angular frontend
- **Role-Based Access Control**: Route guards on frontend and backend
- **Token Expiration**: 24-hour token validity
- **Protected Routes**: All dashboard routes require authentication

## Testing the Application

### Register Users

**Student:**

```json
{
  "email": "student@example.com",
  "password": "password123",
  "fullName": "John Student",
  "role": "STUDENT",
  "phone": "1234567890"
}
```

**Instructor:**

```json
{
  "email": "instructor@example.com",
  "password": "password123",
  "fullName": "Jane Instructor",
  "role": "INSTRUCTOR",
  "phone": "0987654321"
}
```

**Admin:**

```json
{
  "email": "admin@example.com",
  "password": "password123",
  "fullName": "Admin User",
  "role": "ADMIN",
  "phone": "5555555555"
}
```

### Login and Access Dashboards

1. Navigate to `http://localhost:4200/login`
2. Login with registered credentials
3. You'll be automatically redirected to the appropriate dashboard based on your role

## UI Features

- **Modern Gradient Design**: Purple/violet theme throughout
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Smooth Animations**: CSS transitions and keyframe animations
- **Role Badges**: Visual indicators for different user roles
- **Icon Integration**: SVG icons for better visual appeal
- **Card-Based Layout**: Clean, organized dashboard cards

## Development

### Backend Development

- Port: `8080`
- Hot reload: Enabled with Spring Boot DevTools
- API testing: Use Postman or curl

### Frontend Development

- Port: `4200`
- Hot reload: Automatic with `ng serve`
- Browser: Chrome DevTools for debugging

## Environment Variables

### Backend (`application.properties`)

```properties
server.port=8080
spring.data.mongodb.uri=mongodb://localhost:27017/auth_system
jwt.secret=YourSuperSecretKeyForJWTTokenGenerationMustBeLongEnough123456789
jwt.expiration=86400000
cors.allowed.origins=http://localhost:4200
```

### Frontend (`environment.ts`)

API URL is configured in `auth.service.ts`:

```typescript
private apiUrl = 'http://localhost:8080/api/auth';
```

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `mongod`
- Check connection string in `application.properties`

### CORS Errors

- Verify `cors.allowed.origins` in backend configuration
- Check browser console for specific CORS errors

### JWT Token Issues

- Clear browser localStorage and re-login
- Check token expiration time

### Port Already in Use

- Backend: Change `server.port` in `application.properties`
- Frontend: Use `ng serve --port 4300`

## License

This project is open-source and available for educational purposes.

## Author

Built with using Spring Boot + Angular + MongoDB

---

**Happy Coding! **
