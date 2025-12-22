package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Student Performance Tracking Model
 * Captures quiz scores, difficulty levels, time spent, and completion data
 */
@Document(collection = "student_performance")
public class StudentPerformance {
    
    @Id
    private String id;
    
    private String studentEmail;
    private String courseId;
    private String topicName;
    
    // Performance Metrics
    private List<QuizAttempt> quizAttempts = new ArrayList<>();
    private Map<String, Integer> topicScores = new HashMap<>(); // topicName -> average score
    private Map<String, DifficultyLevel> topicDifficultyLevels = new HashMap<>();
    private Map<String, Long> timeSpentPerTopic = new HashMap<>(); // in seconds
    private Map<String, Double> completionPercentage = new HashMap<>();
    
    // Current Adaptive State
    private DifficultyLevel currentDifficultyLevel = DifficultyLevel.BEGINNER;
    private int consecutiveHighScores = 0;
    private int consecutiveLowScores = 0;
    
    // Recommendations
    private String recommendedTopic;
    private DifficultyLevel recommendedDifficulty;
    private String recommendationReason;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastQuizDate;
    
    // Nested class for Quiz Attempts
    public static class QuizAttempt {
        private String quizId;
        private String topicName;
        private int score;
        private int totalQuestions;
        private DifficultyLevel difficultyLevel;
        private long timeSpent; // in seconds
        private LocalDateTime attemptDate;
        private String quizType; // "normal" or "ai"
        
        public QuizAttempt() {
            this.quizType = "normal";
        }
        
        public QuizAttempt(String quizId, String topicName, int score, int totalQuestions, 
                          DifficultyLevel difficultyLevel, long timeSpent) {
            this.quizId = quizId;
            this.topicName = topicName;
            this.score = score;
            this.totalQuestions = totalQuestions;
            this.difficultyLevel = difficultyLevel;
            this.timeSpent = timeSpent;
            this.attemptDate = LocalDateTime.now();
            this.quizType = "normal";
        }
        
        public double getPercentage() {
            return totalQuestions > 0 ? (score * 100.0 / totalQuestions) : 0;
        }
        
        // Getters and Setters
        public String getQuizId() { return quizId; }
        public void setQuizId(String quizId) { this.quizId = quizId; }
        
        public String getTopicName() { return topicName; }
        public void setTopicName(String topicName) { this.topicName = topicName; }
        
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        
        public int getTotalQuestions() { return totalQuestions; }
        public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
        
        public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
        public void setDifficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; }
        
        public long getTimeSpent() { return timeSpent; }
        public void setTimeSpent(long timeSpent) { this.timeSpent = timeSpent; }
        
        public LocalDateTime getAttemptDate() { return attemptDate; }
        public void setAttemptDate(LocalDateTime attemptDate) { this.attemptDate = attemptDate; }
        
        public String getQuizType() { return quizType; }
        public void setQuizType(String quizType) { this.quizType = quizType; }
    }
    
    // Constructors
    public StudentPerformance() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public StudentPerformance(String studentEmail, String courseId) {
        this();
        this.studentEmail = studentEmail;
        this.courseId = courseId;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    
    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }
    
    public List<QuizAttempt> getQuizAttempts() { return quizAttempts; }
    public void setQuizAttempts(List<QuizAttempt> quizAttempts) { this.quizAttempts = quizAttempts; }
    
    public Map<String, Integer> getTopicScores() { return topicScores; }
    public void setTopicScores(Map<String, Integer> topicScores) { this.topicScores = topicScores; }
    
    public Map<String, DifficultyLevel> getTopicDifficultyLevels() { return topicDifficultyLevels; }
    public void setTopicDifficultyLevels(Map<String, DifficultyLevel> topicDifficultyLevels) { 
        this.topicDifficultyLevels = topicDifficultyLevels; 
    }
    
    public Map<String, Long> getTimeSpentPerTopic() { return timeSpentPerTopic; }
    public void setTimeSpentPerTopic(Map<String, Long> timeSpentPerTopic) { 
        this.timeSpentPerTopic = timeSpentPerTopic; 
    }
    
    public Map<String, Double> getCompletionPercentage() { return completionPercentage; }
    public void setCompletionPercentage(Map<String, Double> completionPercentage) { 
        this.completionPercentage = completionPercentage; 
    }
    
    public DifficultyLevel getCurrentDifficultyLevel() { return currentDifficultyLevel; }
    public void setCurrentDifficultyLevel(DifficultyLevel currentDifficultyLevel) { 
        this.currentDifficultyLevel = currentDifficultyLevel; 
    }
    
    public int getConsecutiveHighScores() { return consecutiveHighScores; }
    public void setConsecutiveHighScores(int consecutiveHighScores) { 
        this.consecutiveHighScores = consecutiveHighScores; 
    }
    
    public int getConsecutiveLowScores() { return consecutiveLowScores; }
    public void setConsecutiveLowScores(int consecutiveLowScores) { 
        this.consecutiveLowScores = consecutiveLowScores; 
    }
    
    public String getRecommendedTopic() { return recommendedTopic; }
    public void setRecommendedTopic(String recommendedTopic) { this.recommendedTopic = recommendedTopic; }
    
    public DifficultyLevel getRecommendedDifficulty() { return recommendedDifficulty; }
    public void setRecommendedDifficulty(DifficultyLevel recommendedDifficulty) { 
        this.recommendedDifficulty = recommendedDifficulty; 
    }
    
    public String getRecommendationReason() { return recommendationReason; }
    public void setRecommendationReason(String recommendationReason) { 
        this.recommendationReason = recommendationReason; 
    }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getLastQuizDate() { return lastQuizDate; }
    public void setLastQuizDate(LocalDateTime lastQuizDate) { this.lastQuizDate = lastQuizDate; }
}
