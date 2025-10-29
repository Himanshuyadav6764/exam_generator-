package com.example.auth.controller;

import com.example.auth.model.User;
import com.example.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "http://localhost:4200")
public class HealthController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/mongodb")
    public ResponseEntity<?> checkMongoConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Test MongoDB connection
            String dbName = mongoTemplate.getDb().getName();
            long userCount = userRepository.count();
            List<String> collections = mongoTemplate.getDb().listCollectionNames().into(new java.util.ArrayList<>());
            
            response.put("status", "✅ Connected");
            response.put("database", dbName);
            response.put("totalUsers", userCount);
            response.put("collections", collections);
            response.put("message", "MongoDB is successfully connected!");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "❌ Disconnected");
            response.put("error", e.getMessage());
            response.put("message", "Failed to connect to MongoDB!");
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            Map<String, Object> response = new HashMap<>();
            response.put("totalUsers", users.size());
            response.put("users", users);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
