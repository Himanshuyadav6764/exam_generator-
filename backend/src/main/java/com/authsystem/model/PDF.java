package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

/**
 * PDF Model - PDF notes/documents for topics
 * Each PDF belongs to a topic and has the same difficulty level
 */
@Document(collection = "pdfs")
public class PDF {
    
    @Id
    private String id;
    
    @Indexed
    private String topicId;        // Foreign key to Topic
    
    @Indexed
    private String subjectId;      // Denormalized for faster queries
    
    private String title;
    private String url;            // Cloudinary PDF URL
    
    @Indexed
    private String difficulty;     // BEGINNER, INTERMEDIATE, ADVANCED (must match topic)
    
    private Integer orderIndex;    // Display order within topic
    private Long fileSize;         // File size in bytes
    private Integer pages;         // Number of pages
    private String description;
    private Boolean isDownloadable; // Allow download
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public PDF() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isDownloadable = true;
        this.orderIndex = 0;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTopicId() {
        return topicId;
    }

    public void setTopicId(String topicId) {
        this.topicId = topicId;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Integer getPages() {
        return pages;
    }

    public void setPages(Integer pages) {
        this.pages = pages;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsDownloadable() {
        return isDownloadable;
    }

    public void setIsDownloadable(Boolean isDownloadable) {
        this.isDownloadable = isDownloadable;
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
        return "PDF{" +
                "id='" + id + '\'' +
                ", topicId='" + topicId + '\'' +
                ", title='" + title + '\'' +
                ", difficulty='" + difficulty + '\'' +
                ", pages=" + pages +
                '}';
    }
}
