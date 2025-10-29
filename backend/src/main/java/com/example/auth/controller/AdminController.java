package com.example.auth.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200")
public class AdminController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getAdminDashboard() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Welcome to Admin Dashboard");
        response.put("role", "ADMIN");
        response.put("features", new String[]{
            "User Management", 
            "System Settings", 
            "Reports & Analytics", 
            "Course Approval",
            "Platform Configuration"
        });
        return response;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getAllUsers() {
        Map<String, Object> response = new HashMap<>();
        response.put("totalUsers", 150);
        response.put("students", 100);
        response.put("instructors", 45);
        response.put("admins", 5);
        return response;
    }
}
