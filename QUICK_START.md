# Quick Start Guide

## Prerequisites Check

- Java 17: `java -version`
- Node.js: `node --version`
- Maven: `mvn --version`

## Start Backend

```bash
cd backend
mvn spring-boot:run
```

Server will start on http://localhost:8081

## Start Frontend

```bash
cd frontend
npm install
ng serve
```

Application will open on http://localhost:4200

## Default Login Credentials

### Admin

- Email: admin@example.com
- Password: admin123

### Instructor

- Email: instructor@example.com
- Password: instructor123

### Student

- Email: student@example.com
- Password: student123

## Common Issues

### Backend won't start

- Check MongoDB connection string in application.properties
- Ensure port 8081 is available
- Verify Java 17 is installed

### Frontend won't start

- Run `npm install` to install dependencies
- Check if port 4200 is available
- Clear npm cache: `npm cache clean --force`

### CORS Errors

- Verify backend is running on port 8081
- Check CORS configuration in SecurityConfig.java

## Environment Variables

Required in `backend/src/main/resources/application.properties`:

- spring.data.mongodb.uri
- jwt.secret
- cloudinary.cloud.name
- cloudinary.api.key
- cloudinary.api.secret
- openai.api.key (Groq API)

## API Testing

Use these endpoints to verify the system:

- Health Check: GET http://localhost:8081/actuator/health
- Login: POST http://localhost:8081/api/auth/login
- Get Courses: GET http://localhost:8081/api/courses

## Development Tools

### Backend Compilation

```bash
cd backend
mvn clean package
```

### Frontend Build

```bash
cd frontend
ng build --configuration=production
```

## Support

For issues, check console logs in both frontend (browser DevTools) and backend (terminal).
