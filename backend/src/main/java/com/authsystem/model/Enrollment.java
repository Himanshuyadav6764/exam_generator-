package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Enrollment Model - Junction table connecting Users and Courses
 * Tracks student progress in courses
 * Relationships:
 * - One enrollment links one user to one course
 * - Tracks completion of multiple sub-contents
 */
@Document(collection = "enrollments")
@CompoundIndex(def = "{'userId': 1, 'courseId': 1}", unique = true)  // One enrollment per user per course
public class Enrollment {
    
    @Id
    private String id;
    
    @Indexed  // Indexed for quick lookup by user
    private String userId;  // References User._id
    
    private String userEmail;  // Denormalized from User.email
    
    @Indexed  // Indexed for quick lookup by course
    private String courseId;  // References Course._id
    
    private LocalDateTime enrolledAt;
    
    @Indexed
    private String status; // ACTIVE, COMPLETED, DROPPED
    
    private int progressPercentage;
    private int totalScore;
    private Map<String, Boolean> completedContents; // SubContentId -> completed status

    public Enrollment() {
        this.enrolledAt = LocalDateTime.now();
        this.status = "ACTIVE";
        this.progressPercentage = 0;
        this.totalScore = 0;
        this.completedContents = new HashMap<>();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(int progressPercentage) {
        this.progressPercentage = progressPercentage;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public Map<String, Boolean> getCompletedContents() {
        return completedContents;
    }

    public void setCompletedContents(Map<String, Boolean> completedContents) {
        this.completedContents = completedContents;
    }
}
