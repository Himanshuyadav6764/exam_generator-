package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Course Model - Main course entity
 * Relationships:
 * - One instructor (User) creates many courses
 * - One course has many sub-contents (SubContent)
 * - One course has many enrollments (Enrollment)
 */
@Document(collection = "courses")
public class Course {
    
    @Id
    private String id;
    
    @TextIndexed(weight = 2)  // Higher weight for better search results
    private String title;
    
    @TextIndexed
    private String description;
    
    @Indexed  // Indexed for quick lookup by instructor
    private String instructorEmail;  // References User.email where role = "INSTRUCTOR"
    
    private String instructorName;   // Denormalized for performance
    
    @Indexed  // Multikey index for array searching
    private List<String> subjects;
    
    private List<String> topics;
    
    // Map of topic names to their subcontents (with videos, PDFs, thumbnails, MCQs, descriptions)
    // Using @Field annotation to ensure MongoDB serializes this properly
    @org.springframework.data.mongodb.core.mapping.Field("topicSubcontents")
    private Map<String, List<TopicSubcontent>> topicSubcontents;
    
    @Indexed
    private String difficulty; // BEGINNER, INTERMEDIATE, ADVANCED
    
    private String thumbnail;
    
    @Indexed
    private String status; // DRAFT, PUBLISHED, ARCHIVED
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int enrolledStudents;
    private double averageRating;

    public Course() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.enrolledStudents = 0;
        this.averageRating = 0.0;
        this.status = "DRAFT";
        this.topicSubcontents = new java.util.LinkedHashMap<>();  // Use LinkedHashMap to preserve order
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

    public List<String> getSubjects() {
        return subjects;
    }

    public void setSubjects(List<String> subjects) {
        this.subjects = subjects;
    }

    public List<String> getTopics() {
        return topics;
    }

    public void setTopics(List<String> topics) {
        this.topics = topics;
    }

    public Map<String, List<TopicSubcontent>> getTopicSubcontents() {
        return topicSubcontents;
    }

    public void setTopicSubcontents(Map<String, List<TopicSubcontent>> topicSubcontents) {
        this.topicSubcontents = topicSubcontents;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
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

    public int getEnrolledStudents() {
        return enrolledStudents;
    }

    public void setEnrolledStudents(int enrolledStudents) {
        this.enrolledStudents = enrolledStudents;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }
}
