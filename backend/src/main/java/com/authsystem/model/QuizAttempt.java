package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "quiz_attempts")
public class QuizAttempt {
    
    @Id
    private String id;
    
    @Indexed
    private String studentEmail;
    
    @Indexed
    private String courseId;
    
    private String topicName;
    private String subcontentName;
    
    @Indexed
    private String difficulty; // EASY, MEDIUM, HARD
    
    private List<QuestionAttempt> questions;
    
    private double score;
    private int totalQuestions;
    private int correctAnswers;
    private long totalTimeTaken; // in seconds
    
    private LocalDateTime attemptedAt;
    private String calculatedNextDifficulty;
    
    public QuizAttempt() {
        this.attemptedAt = LocalDateTime.now();
    }
    
    // Inner class for individual question attempt
    public static class QuestionAttempt {
        private String questionId;
        private String question;
        private int selectedAnswer;
        private int correctAnswer;
        private boolean isCorrect;
        private long timeTaken; // seconds
        
        // Getters and Setters
        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        
        public int getSelectedAnswer() { return selectedAnswer; }
        public void setSelectedAnswer(int selectedAnswer) { this.selectedAnswer = selectedAnswer; }
        
        public int getCorrectAnswer() { return correctAnswer; }
        public void setCorrectAnswer(int correctAnswer) { this.correctAnswer = correctAnswer; }
        
        public boolean isCorrect() { return isCorrect; }
        public void setCorrect(boolean correct) { isCorrect = correct; }
        
        public long getTimeTaken() { return timeTaken; }
        public void setTimeTaken(long timeTaken) { this.timeTaken = timeTaken; }
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
    
    public String getSubcontentName() { return subcontentName; }
    public void setSubcontentName(String subcontentName) { this.subcontentName = subcontentName; }
    
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    
    public List<QuestionAttempt> getQuestions() { return questions; }
    public void setQuestions(List<QuestionAttempt> questions) { this.questions = questions; }
    
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
    
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    
    public long getTotalTimeTaken() { return totalTimeTaken; }
    public void setTotalTimeTaken(long totalTimeTaken) { this.totalTimeTaken = totalTimeTaken; }
    
    public LocalDateTime getAttemptedAt() { return attemptedAt; }
    public void setAttemptedAt(LocalDateTime attemptedAt) { this.attemptedAt = attemptedAt; }
    
    public String getCalculatedNextDifficulty() { return calculatedNextDifficulty; }
    public void setCalculatedNextDifficulty(String calculatedNextDifficulty) { 
        this.calculatedNextDifficulty = calculatedNextDifficulty; 
    }
}
