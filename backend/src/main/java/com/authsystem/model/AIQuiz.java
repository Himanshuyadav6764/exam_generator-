package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;

@Document(collection = "ai_quizzes")
public class AIQuiz {
    @Id
    private String id;
    
    private String courseId;
    private String topicName;
    private String title;
    private String description;
    private List<QuizQuestion> questions;
    private int totalQuestions;
    private int duration; // in minutes
    private String createdBy; // instructor email
    private Date createdAt;
    private Date updatedAt;
    private boolean published;
    
    // Nested class for quiz questions
    public static class QuizQuestion {
        private String id;
        private String type; // "mcq", "true-false", "short-answer"
        private String question;
        private List<String> options; // For MCQ (4 options)
        private Integer correctOption; // 0-3 for MCQ
        private Boolean correctAnswer; // For true-false
        private String shortAnswer; // For short-answer
        private List<String> keywords; // For short-answer evaluation
        private String explanation;
        private int marks;
        
        public QuizQuestion() {}
        
        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        
        public List<String> getOptions() { return options; }
        public void setOptions(List<String> options) { this.options = options; }
        
        public Integer getCorrectOption() { return correctOption; }
        public void setCorrectOption(Integer correctOption) { this.correctOption = correctOption; }
        
        public Boolean getCorrectAnswer() { return correctAnswer; }
        public void setCorrectAnswer(Boolean correctAnswer) { this.correctAnswer = correctAnswer; }
        
        public String getShortAnswer() { return shortAnswer; }
        public void setShortAnswer(String shortAnswer) { this.shortAnswer = shortAnswer; }
        
        public List<String> getKeywords() { return keywords; }
        public void setKeywords(List<String> keywords) { this.keywords = keywords; }
        
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
        
        public int getMarks() { return marks; }
        public void setMarks(int marks) { this.marks = marks; }
    }
    
    // Constructors
    public AIQuiz() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.published = false;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    
    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public List<QuizQuestion> getQuestions() { return questions; }
    public void setQuestions(List<QuizQuestion> questions) { 
        this.questions = questions;
        this.totalQuestions = questions != null ? questions.size() : 0;
    }
    
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    
    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
    
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
}
