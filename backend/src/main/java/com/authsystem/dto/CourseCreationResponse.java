package com.authsystem.dto;

import com.authsystem.model.Course;
import java.util.Map;

/**
 * Response DTO for course creation
 * Returns course details with upload statistics
 */
public class CourseCreationResponse {
    
    private Course course;
    private UploadStatistics uploadStats;
    private String message;
    private boolean success;
    
    public CourseCreationResponse() {
    }
    
    public CourseCreationResponse(Course course, UploadStatistics uploadStats, String message, boolean success) {
        this.course = course;
        this.uploadStats = uploadStats;
        this.message = message;
        this.success = success;
    }
    
    // Getters and Setters
    public Course getCourse() {
        return course;
    }
    
    public void setCourse(Course course) {
        this.course = course;
    }
    
    public UploadStatistics getUploadStats() {
        return uploadStats;
    }
    
    public void setUploadStats(UploadStatistics uploadStats) {
        this.uploadStats = uploadStats;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    /**
     * Inner class for upload statistics
     */
    public static class UploadStatistics {
        private int totalVideos;
        private int totalPdfs;
        private int totalThumbnails;
        private int totalMcqs;
        private int totalTopics;
        private int totalSubcontents;
        private long uploadDurationMs;
        
        public UploadStatistics() {
        }
        
        // Getters and Setters
        public int getTotalVideos() {
            return totalVideos;
        }
        
        public void setTotalVideos(int totalVideos) {
            this.totalVideos = totalVideos;
        }
        
        public int getTotalPdfs() {
            return totalPdfs;
        }
        
        public void setTotalPdfs(int totalPdfs) {
            this.totalPdfs = totalPdfs;
        }
        
        public int getTotalThumbnails() {
            return totalThumbnails;
        }
        
        public void setTotalThumbnails(int totalThumbnails) {
            this.totalThumbnails = totalThumbnails;
        }
        
        public int getTotalMcqs() {
            return totalMcqs;
        }
        
        public void setTotalMcqs(int totalMcqs) {
            this.totalMcqs = totalMcqs;
        }
        
        public int getTotalTopics() {
            return totalTopics;
        }
        
        public void setTotalTopics(int totalTopics) {
            this.totalTopics = totalTopics;
        }
        
        public int getTotalSubcontents() {
            return totalSubcontents;
        }
        
        public void setTotalSubcontents(int totalSubcontents) {
            this.totalSubcontents = totalSubcontents;
        }
        
        public long getUploadDurationMs() {
            return uploadDurationMs;
        }
        
        public void setUploadDurationMs(long uploadDurationMs) {
            this.uploadDurationMs = uploadDurationMs;
        }
    }
}
