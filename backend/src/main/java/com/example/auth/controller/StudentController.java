package com.example.auth.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = "http://localhost:4200")
public class StudentController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String, Object> getStudentDashboard() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Welcome to Student Dashboard");
        response.put("role", "STUDENT");
        response.put("features", new String[]{
            "View Courses", 
            "My Learning", 
            "Assignments", 
            "Grades",
            "Progress Tracking"
        });
        return response;
    }

    @GetMapping("/courses")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String, Object> getMyCourses() {
        Map<String, Object> response = new HashMap<>();
        response.put("courses", new String[]{
            "Java Programming",
            "Spring Boot Masterclass",
            "Angular Development",
            "MongoDB Database"
        });
        return response;
    }
}
