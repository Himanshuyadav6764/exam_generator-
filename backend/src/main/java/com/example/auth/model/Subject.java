package com.example.auth.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

/**
 * Subject Model - Main course categories (e.g., Java Programming, Python, Web Development)
 * This represents a complete course/subject like GeeksforGeeks courses
 * Used for course categorization and filtering by difficulty level
 */
@Document(collection = "subjects")
public class Subject {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String title;          // e.g., "Java Programming" (renamed from name for consistency)
    
    private String description;
    
    @Indexed
    private String difficulty;     // BEGINNER, INTERMEDIATE, ADVANCED
    
    @Indexed
    private String instructorEmail; // Instructor who created this subject
    
    private String instructorName;  // Denormalized for performance
    private String thumbnail;       // Subject thumbnail image URL
    
    @Indexed
    private String status;          // DRAFT, PUBLISHED, ARCHIVED
    
    private String category;        // e.g., "Programming", "Design", "Business"
    private String icon;            // Icon URL or class name
    private Boolean active;         // For enabling/disabling subjects
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Subject() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.active = true;
        this.status = "DRAFT"; // Default status
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getInstructorEmail() {
        return instructorEmail;
    }

    public void setInstructorEmail(String instructorEmail) {
        this.instructorEmail = instructorEmail;
    }

    public String getInstructorName() {
        return instructorName;
    }

    public void setInstructorName(String instructorName) {
        this.instructorName = instructorName;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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

    @Override
    public String toString() {
        return "Subject{" +
                "id='" + id + '\'' +
                ", title='" + title + '\'' +
                ", difficulty='" + difficulty + '\'' +
                ", status='" + status + '\'' +
                ", instructorEmail='" + instructorEmail + '\'' +
                '}';
    }
}
