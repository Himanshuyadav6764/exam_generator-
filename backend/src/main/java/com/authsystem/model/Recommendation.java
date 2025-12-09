package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "recommendations")
public class Recommendation {
    
    @Id
    private String id;
    
    @Indexed
    private String studentEmail;
    
    @Indexed
    private String recommendationType; // NEXT_LESSON, REVISION, PRACTICE_MORE
    
    private String topicName;
    private String subcontentName;
    private String reason;
    private int priority; // 1-5 (1 is highest)
    private String difficulty; // EASY, MEDIUM, HARD
    private int estimatedTime; // in minutes
    
    @Indexed
    private String status; // PENDING, VIEWED, COMPLETED
    
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    
    public Recommendation() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusDays(7); // Expires in 7 days
        this.status = "PENDING";
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    
    public String getRecommendationType() { return recommendationType; }
    public void setRecommendationType(String recommendationType) { this.recommendationType = recommendationType; }
    
    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }
    
    public String getSubcontentName() { return subcontentName; }
    public void setSubcontentName(String subcontentName) { this.subcontentName = subcontentName; }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    
    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }
    
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    
    public int getEstimatedTime() { return estimatedTime; }
    public void setEstimatedTime(int estimatedTime) { this.estimatedTime = estimatedTime; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
