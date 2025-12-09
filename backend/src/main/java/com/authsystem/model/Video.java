package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

/**
 * Video Model - Video content for topics
 * Each video belongs to a topic and has the same difficulty level
 */
@Document(collection = "videos")
public class Video {
    
    @Id
    private String id;
    
    @Indexed
    private String topicId;        // Foreign key to Topic
    
    @Indexed
    private String subjectId;      // Denormalized for faster queries
    
    private String title;
    private String url;            // Cloudinary video URL
    private Integer duration;      // Duration in seconds
    
    @Indexed
    private String difficulty;     // BEGINNER, INTERMEDIATE, ADVANCED (must match topic)
    
    private Integer orderIndex;    // Display order within topic
    private Boolean isPreview;     // Free preview video
    private String description;
    private String thumbnailUrl;   // Video thumbnail
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public Video() {
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

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
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

    public Boolean getIsPreview() {
        return isPreview;
    }

    public void setIsPreview(Boolean isPreview) {
        this.isPreview = isPreview;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
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
        return "Video{" +
                "id='" + id + '\'' +
                ", topicId='" + topicId + '\'' +
                ", title='" + title + '\'' +
                ", difficulty='" + difficulty + '\'' +
                ", duration=" + duration +
                '}';
    }
}
