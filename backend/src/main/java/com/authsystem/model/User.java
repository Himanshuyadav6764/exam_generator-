package com.authsystem.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String email;
    
    private String password;
    
    private String fullName;
    
    private String role; // STUDENT, INSTRUCTOR, ADMIN
    
    private String phone;
    
    private boolean enabled = true;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Recommended courses for students
    private List<CourseRecommendation> recommendations = new ArrayList<>();
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CourseRecommendation {
        private String courseId;
        private LocalDateTime savedAt;
        
        public CourseRecommendation(String courseId) {
            this.courseId = courseId;
            this.savedAt = LocalDateTime.now();
        }
    }
}
