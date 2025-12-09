# Learning Management System (LMS)

A full-stack Learning Management System built with Angular and Spring Boot, featuring adaptive learning, AI-powered quizzes, and comprehensive performance tracking.

## Features

### Core Functionality

- User Authentication with JWT-based secure authentication and role-based access control
- Course Management to create, update, and manage courses with topics and subtopics
- Content Delivery including video lectures, PDF materials, and interactive quizzes
- Adaptive Learning with personalized learning paths based on student performance
- AI Quiz Generation powered by Groq AI with multiple question types
- Performance Tracking with real-time analytics and progress monitoring
- Cloudinary Integration for cloud-based media storage

### User Roles

- **Admin** - System-wide management and user administration
- **Instructor** - Course creation, content management, and student monitoring
- **Student** - Course enrollment, learning, and progress tracking

## Tech Stack

### Backend

- Framework: Spring Boot 3.2.0
- Language: Java 17
- Database: MongoDB Atlas
- Security: Spring Security with JWT
- API: RESTful architecture
- Cloud Storage: Cloudinary
- AI Integration: Groq API (llama-3.3-70b-versatile)

### Frontend

- Framework: Angular
- Language: TypeScript
- Styling: CSS with Material Design
- HTTP Client: Angular HttpClient
- Routing: Angular Router

## Architecture

```
├── backend/                  # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/authsystem/
│   │       ├── controller/   # REST controllers
│   │       ├── model/        # MongoDB entities
│   │       ├── repository/   # Data access layer
│   │       ├── service/      # Business logic
│   │       └── security/     # JWT & authentication
│   └── pom.xml              # Maven dependencies
│
├── frontend/                 # Angular frontend
│   ├── src/app/
│   │   ├── auth/            # Authentication components
│   │   ├── components/      # Shared components
│   │   ├── dashboards/      # Role-specific dashboards
│   │   ├── guards/          # Route guards
│   │   ├── services/        # API services
│   │   └── pipes/           # Custom pipes
│   └── package.json         # NPM dependencies
│
└── tools/                    # Build tools (Maven, JDK)
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 14 or higher
- MongoDB Atlas account
- Cloudinary account
- Groq API key

### Environment Configuration

Configure the following in `backend/src/main/resources/application.properties`:

```properties
spring.data.mongodb.uri=<your-mongodb-uri>
jwt.secret=<your-jwt-secret>
cloudinary.cloud.name=<your-cloud-name>
cloudinary.api.key=<your-api-key>
cloudinary.api.secret=<your-api-secret>
openai.api.key=<your-groq-api-key>
```

### Installation & Setup

#### Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on http://localhost:8081

#### Frontend Setup

```bash
cd frontend
npm install
ng serve
```

Frontend runs on http://localhost:4200

## API Endpoints

### Authentication

- POST /api/auth/login - User login
- POST /api/auth/register - User registration

### Courses

- GET /api/courses - List all courses
- GET /api/courses/{id} - Get course details
- POST /api/courses - Create course (Instructor)
- PUT /api/courses/{id} - Update course (Instructor)
- DELETE /api/courses/{id} - Delete course (Instructor)

### Adaptive Learning

- POST /api/adaptive/quiz-attempt - Record quiz attempt
- GET /api/adaptive/performance - Get student performance
- GET /api/adaptive/progress - Get learning progress

### AI Quiz

- POST /api/ai-quiz/generate - Generate AI quiz
- POST /api/ai-quiz/save - Save generated quiz
- GET /api/ai-quiz/course/{courseId} - Get quizzes by course

### Student Progress

- POST /api/progress/video-watch - Track video viewing
- POST /api/progress/pdf-view - Track PDF viewing
- POST /api/progress/quiz-attempt - Track quiz completion
- GET /api/progress/student/{email}/course/{courseId} - Get progress

## Key Features

### Adaptive Learning System

- Tracks student performance across topics
- Adjusts difficulty levels dynamically (BEGINNER/INTERMEDIATE/ADVANCED)
- Recommends personalized learning paths
- Calculates overall scores and completion percentages

### AI Quiz Generation

- Generates quizzes using Groq AI API
- Supports multiple question types: MCQ, True/False, Short Answer
- Customizable difficulty and topic coverage
- Automatic validation and scoring

### Performance Tracking

- Real-time progress monitoring
- Topic-wise score breakdown
- Time spent analytics
- Strength/weakness identification
- Quiz attempt history

## Security

- Authentication: JWT (JSON Web Tokens)
- Authorization: Role-based access control (ADMIN, INSTRUCTOR, STUDENT)
- Password Encryption: BCrypt hashing
- CORS: Configured for frontend-backend communication
- Token Expiration: Automatic session management

## Database Schema

### Collections

- users - User accounts and authentication
- courses - Course catalog and metadata
- enrollments - Student-course relationships
- student_performance - Adaptive learning data
- student_progress - Activity tracking
- ai_quiz - AI-generated quizzes
- mcq - Traditional MCQ quizzes

## Quick Start Guide

1. Clone the repository
2. Configure environment variables in application.properties
3. Start the backend with mvn spring-boot:run
4. Start the frontend with ng serve
5. Access the application at http://localhost:4200

## License

This project is licensed under the MIT License.
