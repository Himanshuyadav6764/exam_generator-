package com.authsystem.controller;

import com.authsystem.model.*;
import com.authsystem.security.JwtUtil;
import com.authsystem.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            System.out.println("📝 Registration attempt - Email: " + request.getEmail() + ", Role: " + request.getRole());
            User user = new User();
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());
            user.setFullName(request.getFullName());
            user.setRole(request.getRole().toUpperCase());
            user.setPhone(request.getPhone());
            
            User savedUser = authService.register(user);
            System.out.println("✅ User registered successfully - Email: " + savedUser.getEmail());
            
            return ResponseEntity.ok().body("User registered successfully");
        } catch (Exception e) {
            System.out.println("❌ Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("🔐 Login attempt - Email: " + request.getEmail());
        Optional<User> user = authService.authenticate(request.getEmail(), request.getPassword());
        
        if (user.isPresent()) {
            User authenticatedUser = user.get();
            System.out.println("✅ Login successful - Email: " + authenticatedUser.getEmail() + ", Role: " + authenticatedUser.getRole());
            String token = jwtUtil.generateToken(
                authenticatedUser.getEmail(), 
                authenticatedUser.getRole(),
                authenticatedUser.getFullName()
            );
            
            AuthResponse response = new AuthResponse(
                token, 
                authenticatedUser.getRole(),
                authenticatedUser.getEmail(),
                authenticatedUser.getFullName()
            );
            
            return ResponseEntity.ok(response);
        }
        
        System.out.println("❌ Login failed - Invalid credentials for: " + request.getEmail());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body("Invalid email or password");
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            String email = jwtUtil.extractEmail(jwt);
            
            if (jwtUtil.validateToken(jwt, email)) {
                String role = jwtUtil.extractRole(jwt);
                return ResponseEntity.ok().body(role);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getEmail(), request.getNewPassword());
            return ResponseEntity.ok().body("Password reset successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
