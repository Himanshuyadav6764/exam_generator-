# Learning Management System (LMS)

A comprehensive full-stack Learning Management System built with Angular, Spring Boot, and AI-powered microservices, featuring adaptive learning, intelligent quiz generation, and real-time performance tracking.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Database Schema](#database-schema)
- [License](#license)

## ✨ Features

### Core Functionality

- **User Authentication** - JWT-based secure authentication with role-based access control
- **Course Management** - Create, update, and manage courses with topics and subtopics
- **Content Delivery** - Video lectures, PDF materials, and interactive quizzes
- **Adaptive Learning** - Personalized learning paths based on student performance
- **AI Quiz Generation** - Powered by Groq AI with multiple question types
- **Performance Tracking** - Real-time analytics and progress monitoring
- **Cloud Storage** - Cloudinary integration for media management

### User Roles

- **Admin** - System-wide management and user administration
- **Instructor** - Course creation, content management, and student monitoring
- **Student** - Course enrollment, learning, and progress tracking

## 🛠 Tech Stack

### Backend

- **Framework:** Spring Boot 3.2.0
- **Language:** Java 17
- **Database:** MongoDB Atlas
- **Security:** Spring Security with JWT
- **API:** RESTful architecture
- **Cloud Storage:** Cloudinary
- **Build Tool:** Maven 3.9.5

### Frontend

- **Framework:** Angular 17
- **Language:** TypeScript 5.2
- **Styling:** CSS with Material Design principles
- **HTTP Client:** Angular HttpClient
- **Routing:** Angular Router
- **Charts:** Chart.js 4.5

### Microservices

#### AI Quiz Service (Node.js)

- **Runtime:** Node.js
- **Framework:** Express.js 4.18
- **Database:** MongoDB (Mongoose 7.0)
- **AI Integration:** Groq API (llama-3.3-70b-versatile)

#### MCQ Generator (TypeScript)

- **Language:** TypeScript 4.0+
- **Runtime:** ts-node
- **Testing:** Jest 27.0
- **HTTP Client:** Axios

## 📁 Project Structure

```
LOGIN_PAGE/
│
├── backend/                          # Spring Boot Backend Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/authsystem/
│   │   │   │   ├── controller/       # REST API Controllers
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── CourseController.java
│   │   │   │   │   ├── EnrollmentController.java
│   │   │   │   │   ├── StudentProgressController.java
│   │   │   │   │   └── AdaptiveLearningController.java
│   │   │   │   ├── model/           # MongoDB Entity Models
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Course.java
│   │   │   │   │   ├── Enrollment.java
│   │   │   │   │   └── StudentPerformance.java
│   │   │   │   ├── repository/      # MongoDB Repositories
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   ├── CourseRepository.java
│   │   │   │   │   └── EnrollmentRepository.java
│   │   │   │   ├── service/         # Business Logic Layer
│   │   │   │   │   ├── UserService.java
│   │   │   │   │   ├── CourseService.java
│   │   │   │   │   └── AuthService.java
│   │   │   │   ├── security/        # Security & JWT Configuration
│   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   └── SecurityConfig.java
│   │   │   │   └── config/          # Application Configuration
│   │   │   │       ├── WebConfig.java
│   │   │   │       └── MongoConfig.java
│   │   │   └── resources/
│   │   │       └── application.properties  # Configuration file
│   │   └── test/                    # Unit and Integration Tests
│   ├── target/                      # Compiled classes and JAR
│   ├── pom.xml                      # Maven dependencies & build config
│   └── Dockerfile                   # Docker configuration for backend
│
├── frontend/                         # Angular Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/                # Authentication Module
│   │   │   │   ├── login/           # Login component
│   │   │   │   ├── register/        # Registration component
│   │   │   │   └── auth.service.ts  # Auth service
│   │   │   ├── components/          # Shared Components
│   │   │   │   ├── navbar/
│   │   │   │   ├── sidebar/
│   │   │   │   └── footer/
│   │   │   ├── dashboards/          # Role-based Dashboards
│   │   │   │   ├── admin-dashboard/
│   │   │   │   ├── instructor-dashboard/
│   │   │   │   └── student-dashboard/
│   │   │   ├── guards/              # Route Guards
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── services/            # API Services
│   │   │   │   ├── course.service.ts
│   │   │   │   ├── quiz.service.ts
│   │   │   │   └── progress.service.ts
│   │   │   ├── pipes/               # Custom Pipes
│   │   │   ├── app-routing.module.ts
│   │   │   ├── app.component.ts
│   │   │   └── app.module.ts
│   │   ├── assets/                  # Static assets
│   │   ├── index.html               # Main HTML file
│   │   ├── main.ts                  # Application entry point
│   │   └── styles.css               # Global styles
│   ├── angular.json                 # Angular configuration
│   ├── package.json                 # NPM dependencies
│   └── tsconfig.json                # TypeScript configuration
│
├── ai-quiz-service/                  # AI Quiz Microservice (Node.js)
│   ├── controllers/
│   │   ├── aiQuizController.js      # AI quiz generation logic
│   │   └── performanceController.js # Performance tracking
│   ├── models/
│   │   ├── aiQuizModel.js           # Quiz model
│   │   ├── aiQuizTestModel.js       # Quiz test model
│   │   ├── studentPerformanceModel.js
│   │   ├── subcontentModel.js
│   │   └── topicModel.js
│   ├── routes/
│   │   ├── aiQuizRoutes.js          # Quiz API routes
│   │   └── performanceRoutes.js     # Performance routes
│   ├── server.js                    # Express server entry point
│   ├── seed-data.js                 # Database seeding script
│   ├── package.json                 # Node dependencies
│   └── README.md                    # Service documentation
│
├── mcq-generator/                    # MCQ Generation Service (TypeScript)
│   ├── src/
│   │   ├── agents/                  # AI Agent Logic
│   │   │   ├── mcqGeneratorAgent.ts # MCQ generation agent
│   │   │   └── questionValidatorAgent.ts # Validation agent
│   │   ├── config/
│   │   │   └── aiConfig.ts          # AI model configuration
│   │   ├── models/
│   │   │   ├── mcq.model.ts         # MCQ data models
│   │   │   └── topic.model.ts       # Topic models
│   │   ├── services/
│   │   │   ├── aiModelService.ts    # AI model integration
│   │   │   ├── evaluationService.ts # Evaluation logic
│   │   │   └── mcqService.ts        # MCQ service
│   │   ├── types/
│   │   │   └── index.ts             # Type definitions
│   │   ├── utils/
│   │   │   ├── promptTemplates.ts   # AI prompt templates
│   │   │   └── validators.ts        # Validation utilities
│   │   └── index.ts                 # Service entry point
│   ├── data/
│   │   ├── sample-mcqs.json         # Sample MCQ data
│   │   └── topics.json              # Topic definitions
│   ├── tests/                       # Test suites
│   │   ├── integration/
│   │   └── unit/
│   ├── package.json                 # Dependencies
│   └── tsconfig.json                # TypeScript config
│
├── tools/                            # Development Tools
│   ├── apache-maven-3.9.5/          # Maven build tool
│   │   ├── bin/                     # Maven executables
│   │   ├── conf/                    # Maven configuration
│   │   └── lib/                     # Maven libraries
│   └── jdk-17.0.9+8/                # Java Development Kit 17
│       ├── bin/                     # Java executables
│       ├── conf/                    # JDK configuration
│       └── lib/                     # JDK libraries
│
├── LICENSE                          # Project license
├── README.md                        # This file
├── QUICK_START.md                   # Quick start guide
└── QUIZ-TRACKING-FIX.md            # Quiz tracking documentation
```

### Folder Descriptions

#### `/backend`

Contains the main Spring Boot application that handles authentication, course management, and core business logic. Uses MongoDB for data persistence and implements JWT-based security.

#### `/frontend`

Angular-based single-page application providing the user interface for all three user roles (Admin, Instructor, Student) with responsive design and real-time updates.

#### `/ai-quiz-service`

Standalone Node.js microservice responsible for generating AI-powered quizzes using the Groq API and tracking student performance with adaptive learning algorithms.

#### `/mcq-generator`

TypeScript-based service for generating and validating multiple-choice questions using AI agents. Includes evaluation and prompt engineering capabilities.

#### `/tools`

Contains local development tools including Maven 3.9.5 and JDK 17 for building and running the Java backend without requiring system-wide installations.

## 📋 Prerequisites

### Required Software

- **Java:** 17 or higher
- **Node.js:** 18.19.0 or higher
- **npm:** 9.0.0 or higher
- **MongoDB:** Atlas account or local installation
- **Git:** For version control

### Required Accounts & API Keys

- **MongoDB Atlas:** Database hosting
- **Cloudinary:** Media storage (images, videos, PDFs)
- **Groq API:** AI quiz generation

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd LOGIN_PAGE
```

### 2. Backend Setup

```bash
cd backend

# Configure environment variables (see Environment Configuration section)

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

Backend runs on **http://localhost:8081**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
ng serve
```

Frontend runs on **http://localhost:4200**

### 4. AI Quiz Service Setup

```bash
cd ai-quiz-service

# Install dependencies
npm install

# Start the service
npm start

# Or use nodemon for development
npm run dev
```

Service runs on **http://localhost:5000**

### 5. MCQ Generator Setup

```bash
cd mcq-generator

# Install dependencies
npm install

# Start the service
npm start

# Run tests
npm test
```

## ⚙️ Environment Configuration

### Backend Configuration

Create or update `backend/src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8081

# MongoDB Configuration
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
spring.data.mongodb.database=lms_database

# JWT Configuration
jwt.secret=your-super-secret-jwt-key-change-this-in-production
jwt.expiration=86400000

# Cloudinary Configuration (Media Storage)
cloudinary.cloud.name=your-cloudinary-cloud-name
cloudinary.api.key=your-cloudinary-api-key
cloudinary.api.secret=your-cloudinary-api-secret

# Groq AI Configuration
openai.api.key=your-groq-api-key
openai.api.url=https://api.groq.com/openai/v1/chat/completions

# CORS Configuration
cors.allowed.origins=http://localhost:4200,https://your-production-domain.com

# File Upload Configuration
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB

# Logging
logging.level.com.authsystem=INFO
logging.level.org.springframework.security=DEBUG
```

### Frontend Configuration

Create `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:8081/api",
  aiQuizServiceUrl: "http://localhost:5000/api",
};
```

Create `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://your-backend-domain.com/api",
  aiQuizServiceUrl: "https://your-ai-service-domain.com/api",
};
```

### AI Quiz Service Configuration

Create `ai-quiz-service/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/lms_database?retryWrites=true&w=majority
GROQ_API_KEY=your-groq-api-key
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
NODE_ENV=development
```

### MCQ Generator Configuration

Update `mcq-generator/src/config/aiConfig.ts`:

```typescript
export const aiConfig = {
  apiKey: process.env.GROQ_API_KEY || "your-api-key",
  apiUrl: "https://api.groq.com/openai/v1/chat/completions",
  model: "llama-3.3-70b-versatile",
  maxTokens: 2000,
  temperature: 0.7,
};
```

## 🚢 Production Deployment

### Deployment Architecture

```
                   ┌─────────────────┐
                   │   Users/Clients │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │  Load Balancer  │
                   │   (Nginx/CDN)   │
                   └────────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐
    │ Frontend │    │   Backend   │   │  AI Quiz    │
    │ (Angular)│    │(Spring Boot)│   │  Service    │
    │  Static  │    │   API       │   │  (Node.js)  │
    └──────────┘    └──────┬──────┘   └──────┬──────┘
                            │                 │
                   ┌────────▼─────────────────▼───┐
                   │    MongoDB Atlas Cloud      │
                   │    (Database as a Service)   │
                   └──────────────────────────────┘
                   ┌──────────────────────────────┐
                   │    Cloudinary CDN            │
                   │    (Media Storage)           │
                   └──────────────────────────────┘
```

### Option 1: Docker Deployment (Recommended)

#### 1. Create Docker Compose File

Create `docker-compose.yml` in the root directory:

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "8081:8081"
    environment:
      - SPRING_DATA_MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
      - OPENAI_API_KEY=${GROQ_API_KEY}
    restart: unless-stopped
    networks:
      - lms-network

  ai-quiz-service:
    build: ./ai-quiz-service
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - PORT=5000
    restart: unless-stopped
    networks:
      - lms-network

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
      - ai-quiz-service
    restart: unless-stopped
    networks:
      - lms-network

networks:
  lms-network:
    driver: bridge
```

#### 2. Create Dockerfile for Backend

Update `backend/Dockerfile`:

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/auth-system-1.0.0.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 3. Create Dockerfile for AI Quiz Service

Create `ai-quiz-service/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### 4. Create Dockerfile for Frontend

Create `frontend/Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist/auth-frontend /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8081/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 5. Deploy with Docker

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Option 2: Cloud Platform Deployment

#### AWS Deployment

##### Backend (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize Elastic Beanstalk
cd backend
eb init -p java-17 lms-backend --region us-east-1

# Create environment
eb create lms-backend-prod

# Deploy
mvn clean package
eb deploy

# Configure environment variables
eb setenv SPRING_DATA_MONGODB_URI="your-mongodb-uri" \
          JWT_SECRET="your-jwt-secret" \
          CLOUDINARY_CLOUD_NAME="your-cloud-name" \
          CLOUDINARY_API_KEY="your-api-key" \
          CLOUDINARY_API_SECRET="your-api-secret" \
          OPENAI_API_KEY="your-groq-key"
```

##### Frontend (S3 + CloudFront)

```bash
# Build for production
cd frontend
npm run build -- --configuration production

# Install AWS CLI
pip install awscli

# Create S3 bucket
aws s3 mb s3://lms-frontend-prod

# Configure bucket for static website hosting
aws s3 website s3://lms-frontend-prod \
    --index-document index.html \
    --error-document index.html

# Upload build files
aws s3 sync dist/auth-frontend/ s3://lms-frontend-prod

# Create CloudFront distribution (via AWS Console or CLI)
```

##### AI Quiz Service (EC2 or ECS)

```bash
# For EC2 deployment
ssh -i your-key.pem ec2-user@your-ec2-instance

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone and deploy
git clone <repository-url>
cd ai-quiz-service
npm install --production
npm install -g pm2

# Start with PM2
pm2 start server.js --name ai-quiz-service
pm2 save
pm2 startup
```

#### Azure Deployment

##### Backend (Azure App Service)

```bash
# Install Azure CLI
# Windows: Download from https://aka.ms/installazurecliwindows

# Login
az login

# Create resource group
az group create --name lms-rg --location eastus

# Create App Service plan
az appservice plan create --name lms-plan --resource-group lms-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group lms-rg --plan lms-plan --name lms-backend --runtime "JAVA:17-java17"

# Configure app settings
az webapp config appsettings set --resource-group lms-rg --name lms-backend --settings \
    SPRING_DATA_MONGODB_URI="your-mongodb-uri" \
    JWT_SECRET="your-jwt-secret"

# Deploy JAR
cd backend
mvn clean package
az webapp deploy --resource-group lms-rg --name lms-backend --src-path target/auth-system-1.0.0.jar
```

##### Frontend (Azure Static Web Apps)

```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Build
cd frontend
npm run build -- --configuration production

# Deploy
swa deploy ./dist/auth-frontend --env production
```

#### Google Cloud Platform (GCP) Deployment

##### Backend (Cloud Run)

```bash
# Install gcloud CLI
# Follow: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project your-project-id

# Build and deploy
cd backend
mvn clean package
gcloud run deploy lms-backend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

##### Frontend (Firebase Hosting)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
cd frontend
firebase init hosting

# Build and deploy
npm run build -- --configuration production
firebase deploy --only hosting
```

### Option 3: VPS/Dedicated Server Deployment (Ubuntu)

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 17
sudo apt install openjdk-17-jdk -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Clone repository
git clone <repository-url> /var/www/lms
cd /var/www/lms

# Deploy Backend
cd backend
./mvnw clean package
nohup java -jar target/auth-system-1.0.0.jar &

# Deploy AI Quiz Service
cd ../ai-quiz-service
npm install --production
npm install -g pm2
pm2 start server.js --name ai-quiz-service
pm2 save
pm2 startup

# Build and Deploy Frontend
cd ../frontend
npm install
npm run build -- --configuration production

# Configure Nginx
sudo nano /etc/nginx/sites-available/lms
```

Add Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/lms/frontend/dist/auth-frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8081/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # AI Quiz Service
    location /ai-api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### Production Checklist

- [ ] Update all environment variables with production values
- [ ] Change JWT secret to a strong, random value
- [ ] Configure MongoDB Atlas with production cluster
- [ ] Set up proper firewall rules and security groups
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging (CloudWatch, Azure Monitor, Stackdriver)
- [ ] Configure automated backups for MongoDB
- [ ] Set up CI/CD pipeline (GitHub Actions, Jenkins, etc.)
- [ ] Implement rate limiting and API throttling
- [ ] Configure CDN for static assets
- [ ] Set up health check endpoints
- [ ] Enable application performance monitoring (New Relic, Datadog)
- [ ] Configure proper error tracking (Sentry)
- [ ] Set up log aggregation (ELK Stack, Splunk)
- [ ] Test disaster recovery procedures
- [ ] Document deployment runbook
- [ ] Configure auto-scaling policies
- [ ] Set up database connection pooling
- [ ] Optimize database indexes

### Continuous Integration/Continuous Deployment (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy LMS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: "17"
          distribution: "adopt"

      - name: Build with Maven
        run: |
          cd backend
          mvn clean package

      - name: Deploy to Production
        run: |
          # Add your deployment script here

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build -- --configuration production

      - name: Deploy to CDN
        run: |
          # Add your deployment script here
```

## 📚 API Documentation

## 📚 API Documentation

### Base URLs

- **Backend API:** `http://localhost:8081/api` (Development)
- **AI Quiz Service:** `http://localhost:5000/api` (Development)

### Authentication Endpoints

- POST /api/auth/login - User login
- POST /api/auth/register - User registration

**Request Body (Login):**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "STUDENT"
  }
}
```

### Course Endpoints

- GET /api/courses - List all courses
- GET /api/courses/{id} - Get course details
- POST /api/courses - Create course (Instructor/Admin)
- PUT /api/courses/{id} - Update course (Instructor/Admin)
- DELETE /api/courses/{id} - Delete course (Admin)

### Adaptive Learning Endpoints

- POST /api/adaptive/quiz-attempt - Record quiz attempt
- GET /api/adaptive/performance - Get student performance
- GET /api/adaptive/progress - Get learning progress

### AI Quiz Endpoints

- POST /api/ai-quiz/generate - Generate AI quiz
- POST /api/ai-quiz/save - Save generated quiz
- GET /api/ai-quiz/course/{courseId} - Get quizzes by course

### Student Progress Endpoints

- POST /api/progress/video-watch - Track video viewing
- POST /api/progress/pdf-view - Track PDF viewing
- POST /api/progress/quiz-attempt - Track quiz completion
- GET /api/progress/student/{email}/course/{courseId} - Get progress

## 🎯 Key Features Details

### Adaptive Learning System

The adaptive learning system tracks student performance and adjusts content difficulty dynamically:

- **Performance Tracking:** Monitors quiz scores, completion rates, and time spent
- **Difficulty Levels:** BEGINNER → INTERMEDIATE → ADVANCED
- **Personalized Paths:** Recommends next topics based on performance
- **Score Calculation:** Weighted average across all topics
- **Progress Analytics:** Real-time dashboards with visual representations

### AI Quiz Generation

Powered by Groq's llama-3.3-70b-versatile model:

- **Question Types:**
  - Multiple Choice Questions (MCQ)
  - True/False
  - Short Answer
  - Fill in the Blanks
- **Customizable Parameters:**
  - Difficulty level
  - Number of questions
  - Topic coverage
  - Time limits
- **Validation:** Automated answer checking and scoring
- **Feedback:** Detailed explanations for each answer

### Performance Tracking

Comprehensive analytics for all stakeholders:

- **Student View:**
  - Overall progress percentage
  - Topic-wise score breakdown
  - Time spent on each module
  - Strength/weakness identification
  - Historical performance graphs
- **Instructor View:**
  - Class-wide analytics
  - Individual student tracking
  - Topic difficulty analysis
  - Engagement metrics
- **Admin View:**
  - System-wide statistics
  - Course popularity metrics
  - User activity reports

## 🔒 Security

- **Authentication:** JWT (JSON Web Tokens) with 24-hour expiration
- **Authorization:** Role-based access control (RBAC)
  - ADMIN: Full system access
  - INSTRUCTOR: Course and content management
  - STUDENT: Read and learning activities
- **Password Security:** BCrypt hashing with salt rounds
- **CORS:** Configurable cross-origin resource sharing
- **Token Management:** Automatic refresh and expiration handling
- **API Security:** Request validation and sanitization
- **HTTPS:** SSL/TLS encryption in production
- **Rate Limiting:** Protection against brute-force attacks
- **Input Validation:** Server-side validation for all inputs

## 💾 Database Schema

### MongoDB Collections

#### users

```json
{
  "_id": "ObjectId",
  "email": "string (unique)",
  "password": "string (hashed)",
  "role": "ADMIN | INSTRUCTOR | STUDENT",
  "firstName": "string",
  "lastName": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### courses

```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "instructor": "ObjectId (ref: users)",
  "topics": [
    {
      "topicId": "string",
      "title": "string",
      "subtopics": [
        {
          "subtopicId": "string",
          "title": "string",
          "videoUrl": "string",
          "pdfUrl": "string",
          "duration": "number"
        }
      ]
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### enrollments

```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId (ref: users)",
  "courseId": "ObjectId (ref: courses)",
  "enrolledDate": "Date",
  "completionPercentage": "number",
  "status": "ACTIVE | COMPLETED | DROPPED"
}
```

#### student_performance

```json
{
  "_id": "ObjectId",
  "studentEmail": "string",
  "courseId": "string",
  "topicId": "string",
  "score": "number",
  "attemptsCount": "number",
  "difficultyLevel": "BEGINNER | INTERMEDIATE | ADVANCED",
  "lastAttemptDate": "Date"
}
```

#### ai_quiz

```json
{
  "_id": "ObjectId",
  "courseId": "string",
  "topicId": "string",
  "questions": [
    {
      "questionText": "string",
      "options": ["string"],
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "string"
    }
  ],
  "generatedBy": "AI",
  "createdAt": "Date"
}
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
mvn test                    # Run unit tests
mvn verify                  # Run integration tests
mvn test -Dtest=TestClass   # Run specific test
```

### Frontend Tests

```bash
cd frontend
npm test                    # Run unit tests
ng test --code-coverage     # Run with coverage
ng e2e                      # Run end-to-end tests
```

### AI Quiz Service Tests

```bash
cd ai-quiz-service
npm test                    # Run tests
```

### MCQ Generator Tests

```bash
cd mcq-generator
npm test                    # Run unit tests
npm run test:integration    # Run integration tests
```

## 📊 Monitoring and Logging

### Application Logs

```bash
# Backend logs
tail -f backend/logs/application.log

# AI Quiz Service logs
tail -f ai-quiz-service/logs/service.log

# Frontend logs (browser console)
```

### Health Check Endpoints

- Backend: `GET /actuator/health`
- AI Quiz Service: `GET /health`

### Monitoring Tools

- **Application Performance:** New Relic, Datadog, or Application Insights
- **Error Tracking:** Sentry
- **Log Aggregation:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime Monitoring:** UptimeRobot, Pingdom

## 🔧 Troubleshooting

### Common Issues

#### Backend won't start

```bash
# Check Java version
java -version

# Verify MongoDB connection
# Check application.properties MongoDB URI

# Clear Maven cache
mvn clean install -U
```

#### Frontend build errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
npm cache clean --force
```

#### AI Quiz Service connection issues

```bash
# Check environment variables
cat .env

# Verify MongoDB connection
# Test Groq API key

# Restart service
pm2 restart ai-quiz-service
```

#### Database connection errors

- Verify MongoDB Atlas IP whitelist includes your server IP
- Check database credentials
- Ensure network connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors & Support

- **Project Maintainer:** Your Name
- **Email:** support@lms-project.com
- **GitHub:** https://github.com/your-username/lms-project

## 🙏 Acknowledgments

- Spring Boot for the robust backend framework
- Angular team for the powerful frontend framework
- Groq AI for the intelligent quiz generation capabilities
- MongoDB for flexible and scalable data storage
- Cloudinary for reliable media hosting
- All contributors and testers

## 📞 Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Email: support@lms-project.com
- Documentation: See QUICK_START.md for detailed guides

---

**Built with ❤️ by the LMS Team**
