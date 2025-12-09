package com.authsystem.model;

import java.time.LocalDateTime;
import java.util.List;

public class AdaptiveLessonRecommendation {
    
    private String lessonId;
    private String courseId;
    private String courseName;
    private String lessonTitle;
    private String description;
    private int estimatedTimeMinutes;
    private String difficulty; // Beginner, Intermediate, Advanced
    private int difficultyStars; // 1-5 stars
    private List<String> topics;
    private String thumbnailUrl;
    private double matchScore; // 0-100, how well it matches student's level
    private String recommendationReason;
    private LocalDateTime suggestedAt;

    public AdaptiveLessonRecommendation() {
        this.suggestedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getLessonTitle() { return lessonTitle; }
    public void setLessonTitle(String lessonTitle) { this.lessonTitle = lessonTitle; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getEstimatedTimeMinutes() { return estimatedTimeMinutes; }
    public void setEstimatedTimeMinutes(int estimatedTimeMinutes) { this.estimatedTimeMinutes = estimatedTimeMinutes; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public int getDifficultyStars() { return difficultyStars; }
    public void setDifficultyStars(int difficultyStars) { this.difficultyStars = difficultyStars; }
    public List<String> getTopics() { return topics; }
    public void setTopics(List<String> topics) { this.topics = topics; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public double getMatchScore() { return matchScore; }
    public void setMatchScore(double matchScore) { this.matchScore = matchScore; }
    public String getRecommendationReason() { return recommendationReason; }
    public void setRecommendationReason(String recommendationReason) { this.recommendationReason = recommendationReason; }
    public LocalDateTime getSuggestedAt() { return suggestedAt; }
    public void setSuggestedAt(LocalDateTime suggestedAt) { this.suggestedAt = suggestedAt; }
}
