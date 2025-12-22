package com.authsystem.service;

import com.authsystem.model.User;
import com.authsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User register(User user) throws Exception {
        // Normalize email to lowercase
        String normalizedEmail = user.getEmail().toLowerCase().trim();
        
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new Exception("Email already exists");
        }
        
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Optional<User> authenticate(String email, String password) {
        // Convert email to lowercase for case-insensitive matching
        String normalizedEmail = email.toLowerCase().trim();
        Optional<User> user = userRepository.findByEmail(normalizedEmail);
        
        if (!user.isPresent()) {
            // Try original email if normalized didn't work
            user = userRepository.findByEmail(email);
        }
        
        if (user.isPresent()) {
            System.out.println("👤 User found: " + user.get().getEmail());
            if (passwordEncoder.matches(password, user.get().getPassword())) {
                System.out.println("✅ Password match successful");
                return user;
            } else {
                System.out.println("❌ Password mismatch");
            }
        } else {
            System.out.println("❌ User not found with email: " + email);
        }
        
        return Optional.empty();
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean resetPassword(String email, String newPassword) throws Exception {
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (!userOptional.isPresent()) {
            throw new Exception("User not found");
        }
        
        User user = userOptional.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        return true;
    }
}
