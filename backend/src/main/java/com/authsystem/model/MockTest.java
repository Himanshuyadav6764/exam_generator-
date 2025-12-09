package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "mock_tests")
public class MockTest {
    
    @Id
    private String id;
    private String courseId;
    private String title;
    private String description;
    private String difficulty; // BEGINNER, INTERMEDIATE, ADVANCED
    private List<String> topics; // Topics covered in this test
    private List<String> mcqIds; // List of MCQ IDs
    private int totalQuestions;
    private int totalPoints;
    private int duration; // Duration in minutes
    private String createdBy; // Instructor email
    private String createdAt;
    private boolean isActive;
    
    // Constructors
    public MockTest() {
    }
    
    public MockTest(String courseId, String title, String description, String difficulty, 
                    List<String> topics, List<String> mcqIds, int duration, String createdBy) {
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.difficulty = difficulty;
        this.topics = topics;
        this.mcqIds = mcqIds;
        this.totalQuestions = mcqIds != null ? mcqIds.size() : 0;
        this.duration = duration;
        this.createdBy = createdBy;
        this.createdAt = new java.util.Date().toString();
        this.isActive = true;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getCourseId() {
        return courseId;
    }
    
    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getDifficulty() {
        return difficulty;
    }
    
    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }
    
    public List<String> getTopics() {
        return topics;
    }
    
    public void setTopics(List<String> topics) {
        this.topics = topics;
    }
    
    public List<String> getMcqIds() {
        return mcqIds;
    }
    
    public void setMcqIds(List<String> mcqIds) {
        this.mcqIds = mcqIds;
        this.totalQuestions = mcqIds != null ? mcqIds.size() : 0;
    }
    
    public int getTotalQuestions() {
        return totalQuestions;
    }
    
    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }
    
    public int getTotalPoints() {
        return totalPoints;
    }
    
    public void setTotalPoints(int totalPoints) {
        this.totalPoints = totalPoints;
    }
    
    public int getDuration() {
        return duration;
    }
    
    public void setDuration(int duration) {
        this.duration = duration;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public String getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
}
