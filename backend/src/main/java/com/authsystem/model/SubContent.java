package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import java.time.LocalDateTime;

/**
 * SubContent Model - Course content (videos, PDFs, links, documents)
 * Relationships:
 * - Many sub-contents belong to one course
 * - One sub-content can have many questions (Question)
 * - One sub-content can have many materials (Material)
 */
@Document(collection = "sub_contents")
@CompoundIndex(def = "{'courseId': 1, 'orderIndex': 1}")  // For ordered content retrieval
public class SubContent {
    
    @Id
    private String id;
    
    @Indexed  // Indexed for quick lookup by course
    private String courseId;  // References Course._id
    
    private String title;
    private String description;
    
    @Indexed
    private String contentType; // VIDEO, PDF, LINK, DOCUMENT
    
    private String url; // YouTube link, Drive link, or file URL
    
    @Indexed
    private String topic; // Topic this content belongs to
    
    private String difficulty; // BEGINNER, INTERMEDIATE, ADVANCED
    private int score; // Points for completing this content
    private int duration; // Duration in minutes
    
    @Indexed
    private int orderIndex; // Order within the course
    
    private boolean isPreview; // Can be viewed without enrollment
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SubContent() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isPreview = false;
        this.orderIndex = 0;
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

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getDuration() {
        return duration;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }

    public int getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(int orderIndex) {
        this.orderIndex = orderIndex;
    }

    public boolean isPreview() {
        return isPreview;
    }

    public void setPreview(boolean preview) {
        isPreview = preview;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
