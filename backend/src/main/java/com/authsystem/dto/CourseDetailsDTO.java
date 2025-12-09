package com.authsystem.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Course Details DTO - Complete course information with computed counts
 * Used for both instructor and student panels
 */
public class CourseDetailsDTO {
    
    // Basic course info
    private String id;
    private String title;
    private String description;
    private String instructorName;
    private String instructorEmail;
    private String difficulty;
    private String status;
    private String thumbnail;
    private List<String> subjects;
    private int enrolledStudents;
    private double averageRating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Topics structure
    private List<String> topics;
    private Map<String, List<SubtopicDetailsDTO>> topicSubcontents;
    
    // Computed counts
    private CourseContentCounts contentCounts;
    
    // Nested class for subtopic details
    public static class SubtopicDetailsDTO {
        private String name;
        private String description;
        private List<String> videoUrls;
        private List<String> videoFileNames;
        private List<String> pdfUrls;
        private List<String> pdfFileNames;
        private String thumbnailUrl;
        private int videoCount;
        private int pdfCount;
        private int mcqCount;
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public List<String> getVideoUrls() { return videoUrls; }
        public void setVideoUrls(List<String> videoUrls) { this.videoUrls = videoUrls; }
        
        public List<String> getVideoFileNames() { return videoFileNames; }
        public void setVideoFileNames(List<String> videoFileNames) { this.videoFileNames = videoFileNames; }
        
        public List<String> getPdfUrls() { return pdfUrls; }
        public void setPdfUrls(List<String> pdfUrls) { this.pdfUrls = pdfUrls; }
        
        public List<String> getPdfFileNames() { return pdfFileNames; }
        public void setPdfFileNames(List<String> pdfFileNames) { this.pdfFileNames = pdfFileNames; }
        
        public String getThumbnailUrl() { return thumbnailUrl; }
        public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
        
        public int getVideoCount() { return videoCount; }
        public void setVideoCount(int videoCount) { this.videoCount = videoCount; }
        
        public int getPdfCount() { return pdfCount; }
        public void setPdfCount(int pdfCount) { this.pdfCount = pdfCount; }
        
        public int getMcqCount() { return mcqCount; }
        public void setMcqCount(int mcqCount) { this.mcqCount = mcqCount; }
    }
    
    // Nested class for content counts
    public static class CourseContentCounts {
        private int totalTopics;
        private int totalSubtopics;
        private int totalVideos;
        private int totalPdfs;
        private int totalMcqs;
        
        // Per-topic breakdown
        private Map<String, TopicContentCounts> topicBreakdown;
        
        // Getters and Setters
        public int getTotalTopics() { return totalTopics; }
        public void setTotalTopics(int totalTopics) { this.totalTopics = totalTopics; }
        
        public int getTotalSubtopics() { return totalSubtopics; }
        public void setTotalSubtopics(int totalSubtopics) { this.totalSubtopics = totalSubtopics; }
        
        public int getTotalVideos() { return totalVideos; }
        public void setTotalVideos(int totalVideos) { this.totalVideos = totalVideos; }
        
        public int getTotalPdfs() { return totalPdfs; }
        public void setTotalPdfs(int totalPdfs) { this.totalPdfs = totalPdfs; }
        
        public int getTotalMcqs() { return totalMcqs; }
        public void setTotalMcqs(int totalMcqs) { this.totalMcqs = totalMcqs; }
        
        public Map<String, TopicContentCounts> getTopicBreakdown() { return topicBreakdown; }
        public void setTopicBreakdown(Map<String, TopicContentCounts> topicBreakdown) { 
            this.topicBreakdown = topicBreakdown; 
        }
    }
    
    // Nested class for per-topic counts
    public static class TopicContentCounts {
        private int subtopicCount;
        private int videoCount;
        private int pdfCount;
        private int mcqCount;
        
        // Getters and Setters
        public int getSubtopicCount() { return subtopicCount; }
        public void setSubtopicCount(int subtopicCount) { this.subtopicCount = subtopicCount; }
        
        public int getVideoCount() { return videoCount; }
        public void setVideoCount(int videoCount) { this.videoCount = videoCount; }
        
        public int getPdfCount() { return pdfCount; }
        public void setPdfCount(int pdfCount) { this.pdfCount = pdfCount; }
        
        public int getMcqCount() { return mcqCount; }
        public void setMcqCount(int mcqCount) { this.mcqCount = mcqCount; }
    }
    
    // Main DTO Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }
    
    public String getInstructorEmail() { return instructorEmail; }
    public void setInstructorEmail(String instructorEmail) { this.instructorEmail = instructorEmail; }
    
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getThumbnail() { return thumbnail; }
    public void setThumbnail(String thumbnail) { this.thumbnail = thumbnail; }
    
    public List<String> getSubjects() { return subjects; }
    public void setSubjects(List<String> subjects) { this.subjects = subjects; }
    
    public int getEnrolledStudents() { return enrolledStudents; }
    public void setEnrolledStudents(int enrolledStudents) { this.enrolledStudents = enrolledStudents; }
    
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<String> getTopics() { return topics; }
    public void setTopics(List<String> topics) { this.topics = topics; }
    
    public Map<String, List<SubtopicDetailsDTO>> getTopicSubcontents() { return topicSubcontents; }
    public void setTopicSubcontents(Map<String, List<SubtopicDetailsDTO>> topicSubcontents) { 
        this.topicSubcontents = topicSubcontents; 
    }
    
    public CourseContentCounts getContentCounts() { return contentCounts; }
    public void setContentCounts(CourseContentCounts contentCounts) { this.contentCounts = contentCounts; }
}
