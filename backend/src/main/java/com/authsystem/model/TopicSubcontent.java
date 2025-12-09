package com.authsystem.model;

import java.util.List;
import java.util.ArrayList;

/**
 * TopicSubcontent Model - Represents a subcontent item within a topic
 * Contains videos, PDFs, thumbnails, MCQ questions, and description
 */
public class TopicSubcontent {
    
    private String name;
    private String description;
    private List<String> videoUrls;
    private List<String> videoFileNames;
    private List<String> pdfUrls;
    private List<String> pdfFileNames;
    private String thumbnailUrl;
    private String thumbnailFileName;
    private int mcqCount;
    private List<MCQQuestion> mcqQuestions;
    private boolean published;

    public TopicSubcontent() {
        this.description = "";
        this.videoUrls = new ArrayList<>();
        this.videoFileNames = new ArrayList<>();
        this.pdfUrls = new ArrayList<>();
        this.pdfFileNames = new ArrayList<>();
        this.mcqCount = 0;
        this.mcqQuestions = new ArrayList<>();
        this.published = false;
    }

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getVideoUrls() {
        return videoUrls;
    }

    public void setVideoUrls(List<String> videoUrls) {
        this.videoUrls = videoUrls;
    }

    public List<String> getVideoFileNames() {
        return videoFileNames;
    }

    public void setVideoFileNames(List<String> videoFileNames) {
        this.videoFileNames = videoFileNames;
    }

    public List<String> getPdfUrls() {
        return pdfUrls;
    }

    public void setPdfUrls(List<String> pdfUrls) {
        this.pdfUrls = pdfUrls;
    }

    public List<String> getPdfFileNames() {
        return pdfFileNames;
    }

    public void setPdfFileNames(List<String> pdfFileNames) {
        this.pdfFileNames = pdfFileNames;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getThumbnailFileName() {
        return thumbnailFileName;
    }

    public void setThumbnailFileName(String thumbnailFileName) {
        this.thumbnailFileName = thumbnailFileName;
    }

    public int getMcqCount() {
        return mcqCount;
    }

    public void setMcqCount(int mcqCount) {
        this.mcqCount = mcqCount;
    }
    
    public List<MCQQuestion> getMcqQuestions() {
        return mcqQuestions;
    }

    public void setMcqQuestions(List<MCQQuestion> mcqQuestions) {
        this.mcqQuestions = mcqQuestions;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }
}
