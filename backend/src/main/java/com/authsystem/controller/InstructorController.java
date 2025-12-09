package com.example.auth.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/instructor")
@CrossOrigin(origins = "http://localhost:4200")
public class InstructorController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public Map<String, Object> getInstructorDashboard() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Welcome to Instructor Dashboard");
        response.put("role", "INSTRUCTOR");
        response.put("features", new String[]{
            "Upload Course", 
            "Manage Students", 
            "Create Assignments", 
            "Grade Submissions",
            "Course Analytics"
        });
        return response;
    }

    @GetMapping("/courses")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public Map<String, Object> getMyCourses() {
        Map<String, Object> response = new HashMap<>();
        response.put("courses", new String[]{
            "Advanced Java",
            "Microservices Architecture",
            "Database Design"
        });
        return response;
    }
}
