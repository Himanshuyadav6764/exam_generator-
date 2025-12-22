package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "student_progress")
// REMOVED CompoundIndex to prevent MongoDB duplicate key errors
// @CompoundIndex(def = "{'studentEmail': 1, 'courseId': 1}", unique = false)
public class StudentProgress {
    
    @Id
    private String id;
    
    @Indexed
    private String studentEmail;
    
    @Indexed
    private String courseId;
    
    private String courseName;
    private String currentLevel; // Beginner, Intermediate, Advanced, Mastery
    private double overallScore;
    private int lessonsCompleted;
    private int quizzesPassed;
    private int totalTimeSpentMinutes;
    private int currentStreak;
    private LocalDateTime lastActivityDate;
    
    // Topic name -> TopicMastery
    private Map<String, TopicMastery> topicMastery;
    
    private OverallPerformance overallPerformance;
    
    private List<LessonProgress> lessonProgressList;
    private List<QuizAttempt> quizAttempts;
    private List<ActivityLog> recentActivities;
    
    // Student notes by topic and subtopic
    private Map<String, Map<String, String>> notes; // topicName -> subtopicName -> notes
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public StudentProgress() {
        this.topicMastery = new HashMap<>();
        this.overallPerformance = new OverallPerformance();
        this.currentLevel = "Beginner";
        this.overallScore = 0.0;
        this.lessonsCompleted = 0;
        this.quizzesPassed = 0;
        this.totalTimeSpentMinutes = 0;
        this.currentStreak = 0;
        this.lessonProgressList = new ArrayList<>();
        this.quizAttempts = new ArrayList<>();
        this.recentActivities = new ArrayList<>();
        this.notes = new HashMap<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Inner class for Topic Mastery
    public static class TopicMastery {
        private int totalAttempts;
        private int correctAnswers;
        private double averageScore;
        private long timeSpent; // in seconds
        private LocalDateTime lastAttemptDate;
        private String difficulty; // EASY, MEDIUM, HARD
        private String trend; // IMPROVING, STABLE, DECLINING
        private java.util.List<String> weakAreas;
        
        public TopicMastery() {
            this.totalAttempts = 0;
            this.correctAnswers = 0;
            this.averageScore = 0.0;
            this.timeSpent = 0;
            this.difficulty = "EASY";
            this.trend = "STABLE";
            this.weakAreas = new java.util.ArrayList<>();
        }
        
        // Getters and Setters
        public int getTotalAttempts() { return totalAttempts; }
        public void setTotalAttempts(int totalAttempts) { this.totalAttempts = totalAttempts; }
        
        public int getCorrectAnswers() { return correctAnswers; }
        public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
        
        public double getAverageScore() { return averageScore; }
        public void setAverageScore(double averageScore) { this.averageScore = averageScore; }
        
        public long getTimeSpent() { return timeSpent; }
        public void setTimeSpent(long timeSpent) { this.timeSpent = timeSpent; }
        
        public LocalDateTime getLastAttemptDate() { return lastAttemptDate; }
        public void setLastAttemptDate(LocalDateTime lastAttemptDate) { this.lastAttemptDate = lastAttemptDate; }
        
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        
        public String getTrend() { return trend; }
        public void setTrend(String trend) { this.trend = trend; }
        
        public java.util.List<String> getWeakAreas() { return weakAreas; }
        public void setWeakAreas(java.util.List<String> weakAreas) { this.weakAreas = weakAreas; }
    }
    
    // Inner class for Overall Performance
    public static class OverallPerformance {
        private int totalQuizzes;
        private double averageScore;
        private long totalTimeSpent;
        private String performanceLevel; // EXCELLENT, GOOD, AVERAGE, NEEDS_IMPROVEMENT
        private LocalDateTime lastActivityDate;
        
        public OverallPerformance() {
            this.totalQuizzes = 0;
            this.averageScore = 0.0;
            this.totalTimeSpent = 0;
            this.performanceLevel = "AVERAGE";
        }
        
        // Getters and Setters
        public int getTotalQuizzes() { return totalQuizzes; }
        public void setTotalQuizzes(int totalQuizzes) { this.totalQuizzes = totalQuizzes; }
        
        public double getAverageScore() { return averageScore; }
        public void setAverageScore(double averageScore) { this.averageScore = averageScore; }
        
        public long getTotalTimeSpent() { return totalTimeSpent; }
        public void setTotalTimeSpent(long totalTimeSpent) { this.totalTimeSpent = totalTimeSpent; }
        
        public String getPerformanceLevel() { return performanceLevel; }
        public void setPerformanceLevel(String performanceLevel) { this.performanceLevel = performanceLevel; }
        
        public LocalDateTime getLastActivityDate() { return lastActivityDate; }
        public void setLastActivityDate(LocalDateTime lastActivityDate) { this.lastActivityDate = lastActivityDate; }
    }
    
    // Inner classes for Adaptive Learning
    public static class LessonProgress {
        private String lessonId;
        private String lessonTitle;
        private boolean completed;
        private int timeSpentMinutes;
        private LocalDateTime completedAt;

        public LessonProgress() {
            this.completed = false;
            this.timeSpentMinutes = 0;
        }

        public String getLessonId() { return lessonId; }
        public void setLessonId(String lessonId) { this.lessonId = lessonId; }
        public String getLessonTitle() { return lessonTitle; }
        public void setLessonTitle(String lessonTitle) { this.lessonTitle = lessonTitle; }
        public boolean isCompleted() { return completed; }
        public void setCompleted(boolean completed) { this.completed = completed; }
        public int getTimeSpentMinutes() { return timeSpentMinutes; }
        public void setTimeSpentMinutes(int timeSpentMinutes) { this.timeSpentMinutes = timeSpentMinutes; }
        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    }

    public static class QuizAttempt {
        private String quizId;
        private String quizTitle;
        private int score;
        private int totalQuestions;
        private String difficulty;
        private String quizType; // "normal" or "ai"
        private LocalDateTime attemptedAt;
        private boolean passed;

        public QuizAttempt() {
            this.passed = false;
            this.quizType = "normal";
        }

        public String getQuizId() { return quizId; }
        public void setQuizId(String quizId) { this.quizId = quizId; }
        public String getQuizTitle() { return quizTitle; }
        public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        public int getTotalQuestions() { return totalQuestions; }
        public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public String getQuizType() { return quizType; }
        public void setQuizType(String quizType) { this.quizType = quizType; }
        public LocalDateTime getAttemptedAt() { return attemptedAt; }
        public void setAttemptedAt(LocalDateTime attemptedAt) { this.attemptedAt = attemptedAt; }
        public boolean isPassed() { return passed; }
        public void setPassed(boolean passed) { this.passed = passed; }
    }

    public static class ActivityLog {
        private String activityType;
        private String activityTitle;
        private String description;
        private LocalDateTime timestamp;

        public ActivityLog() {}

        public ActivityLog(String activityType, String activityTitle, String description) {
            this.activityType = activityType;
            this.activityTitle = activityTitle;
            this.description = description;
            this.timestamp = LocalDateTime.now();
        }

        public String getActivityType() { return activityType; }
        public void setActivityType(String activityType) { this.activityType = activityType; }
        public String getActivityTitle() { return activityTitle; }
        public void setActivityTitle(String activityTitle) { this.activityTitle = activityTitle; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }
    
    // Main class Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    
    public String getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(String currentLevel) { this.currentLevel = currentLevel; }
    
    public double getOverallScore() { return overallScore; }
    public void setOverallScore(double overallScore) { this.overallScore = overallScore; }
    
    public int getLessonsCompleted() { return lessonsCompleted; }
    public void setLessonsCompleted(int lessonsCompleted) { this.lessonsCompleted = lessonsCompleted; }
    
    public int getQuizzesPassed() { return quizzesPassed; }
    public void setQuizzesPassed(int quizzesPassed) { this.quizzesPassed = quizzesPassed; }
    
    public int getTotalTimeSpentMinutes() { return totalTimeSpentMinutes; }
    public void setTotalTimeSpentMinutes(int totalTimeSpentMinutes) { this.totalTimeSpentMinutes = totalTimeSpentMinutes; }
    
    public int getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }
    
    public LocalDateTime getLastActivityDate() { return lastActivityDate; }
    public void setLastActivityDate(LocalDateTime lastActivityDate) { this.lastActivityDate = lastActivityDate; }
    
    public List<LessonProgress> getLessonProgressList() { return lessonProgressList; }
    public void setLessonProgressList(List<LessonProgress> lessonProgressList) { this.lessonProgressList = lessonProgressList; }
    
    public List<QuizAttempt> getQuizAttempts() { return quizAttempts; }
    public void setQuizAttempts(List<QuizAttempt> quizAttempts) { this.quizAttempts = quizAttempts; }
    
    public List<ActivityLog> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<ActivityLog> recentActivities) { this.recentActivities = recentActivities; }
    
    public Map<String, TopicMastery> getTopicMastery() { return topicMastery; }
    public void setTopicMastery(Map<String, TopicMastery> topicMastery) { this.topicMastery = topicMastery; }
    
    public OverallPerformance getOverallPerformance() { return overallPerformance; }
    public void setOverallPerformance(OverallPerformance overallPerformance) { this.overallPerformance = overallPerformance; }
    
    public Map<String, Map<String, String>> getNotes() { return notes; }
    public void setNotes(Map<String, Map<String, String>> notes) { this.notes = notes; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
