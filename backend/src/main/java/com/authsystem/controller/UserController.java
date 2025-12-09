package com.authsystem.controller;

import com.authsystem.model.User;
import com.authsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * UserController - Handles user credential operations
 * 
 * This controller manages authenticated user operations like:
 * - View profile
 * - Update profile
 * - Change password
 * - Delete account
 * 
 * All endpoints require JWT authentication (user must be logged in)
 */
@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Get current user's email from JWT token (SecurityContext)
     */
    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName(); // Returns email (principal)
    }

    /**
     * GET /api/user/profile
     * Get current user's profile information
     * 
     * JWT Required: Yes
     * Returns: User profile without password
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        try {
            String email = getCurrentUserEmail();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
            }
            
            User user = userOpt.get();
            
            // Create response without password
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("role", user.getRole());
            response.put("phone", user.getPhone());
            response.put("createdAt", user.getCreatedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching profile: " + e.getMessage());
        }
    }

    /**
     * PUT /api/user/profile
     * Update current user's profile information
     * 
     * JWT Required: Yes
     * Allowed Updates: fullName, phone
     * Cannot Update: email, password (use separate endpoints), role
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> updates) {
        try {
            String email = getCurrentUserEmail();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
            }
            
            User user = userOpt.get();
            
            // Update allowed fields only
            if (updates.containsKey("fullName")) {
                user.setFullName(updates.get("fullName"));
            }
            
            if (updates.containsKey("phone")) {
                user.setPhone(updates.get("phone"));
            }
            
            userRepository.save(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile updated successfully");
            response.put("fullName", user.getFullName());
            response.put("phone", user.getPhone());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating profile: " + e.getMessage());
        }
    }

    /**
     * PUT /api/user/change-password
     * Change current user's password
     * 
     * JWT Required: Yes
     * Request Body: { "currentPassword": "old123", "newPassword": "new456" }
     */
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> passwordData) {
        try {
            String email = getCurrentUserEmail();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
            }
            
            User user = userOpt.get();
            
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");
            
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest()
                    .body("Both currentPassword and newPassword are required");
            }
            
            // Verify current password
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Current password is incorrect");
            }
            
            // Validate new password
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                    .body("New password must be at least 6 characters long");
            }
            
            // Update password
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            
            return ResponseEntity.ok()
                .body("Password changed successfully");
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error changing password: " + e.getMessage());
        }
    }

    /**
     * DELETE /api/user/account
     * Delete current user's account
     * 
     * JWT Required: Yes
     * Request Body: { "password": "confirm123" }
     * Warning: This is permanent and cannot be undone
     */
    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String, String> confirmation) {
        try {
            String email = getCurrentUserEmail();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
            }
            
            User user = userOpt.get();
            String password = confirmation.get("password");
            
            if (password == null) {
                return ResponseEntity.badRequest()
                    .body("Password confirmation required");
            }
            
            // Verify password before deletion
            if (!passwordEncoder.matches(password, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Password is incorrect");
            }
            
            // Delete user
            userRepository.delete(user);
            
            // Clear security context
            SecurityContextHolder.clearContext();
            
            return ResponseEntity.ok()
                .body("Account deleted successfully");
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting account: " + e.getMessage());
        }
    }

    /**
     * GET /api/user/stats
     * Get user statistics (for dashboard)
     * 
     * JWT Required: Yes
     * Returns: User-specific statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getUserStats() {
        try {
            String email = getCurrentUserEmail();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
            }
            
            User user = userOpt.get();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("email", user.getEmail());
            stats.put("role", user.getRole());
            stats.put("accountCreated", user.getCreatedAt());
            stats.put("isActive", true);
            
            // Add role-specific stats
            if ("STUDENT".equals(user.getRole())) {
                // TODO: Add enrolled courses count, progress, etc.
                stats.put("enrolledCourses", 0);
                stats.put("completedCourses", 0);
            } else if ("INSTRUCTOR".equals(user.getRole())) {
                // TODO: Add created courses count, students, etc.
                stats.put("createdCourses", 0);
                stats.put("totalStudents", 0);
            }
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching stats: " + e.getMessage());
        }
    }
}
