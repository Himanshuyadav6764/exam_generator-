package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Question Model - Quiz questions attached to video content
 * Can be shown at specific timestamps during video playback
 */
@Document(collection = "questions")
public class Question {
    
    @Id
    private String id;
    
    // References to related documents
    private String subContentId;  // References SubContent._id
    private String courseId;      // References Course._id (denormalized for quick access)
    
    // Question details
    private String questionText;
    private QuestionType questionType;  // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
    private List<String> options;       // For multiple choice questions
    private String correctAnswer;
    private Integer points;             // Points awarded for correct answer
    private Integer timestamp;          // Video position in seconds (null for non-video content)
    private String explanation;         // Explanation shown after answering
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Question() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.points = 1;
    }

    // Enums
    public enum QuestionType {
        MULTIPLE_CHOICE,
        TRUE_FALSE,
        SHORT_ANSWER
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSubContentId() {
        return subContentId;
    }

    public void setSubContentId(String subContentId) {
        this.subContentId = subContentId;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public QuestionType getQuestionType() {
        return questionType;
    }

    public void setQuestionType(QuestionType questionType) {
        this.questionType = questionType;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public Integer getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Integer timestamp) {
        this.timestamp = timestamp;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
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
