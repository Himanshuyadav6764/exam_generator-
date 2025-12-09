package com.authsystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

/**
 * Material Model - Downloadable study materials (PDFs, documents, slides)
 * Attached to specific course content
 */
@Document(collection = "materials")
public class Material {
    
    @Id
    private String id;
    
    // References to related documents
    private String subContentId;  // References SubContent._id
    private String courseId;      // References Course._id (denormalized)
    
    // Material details
    private MaterialType materialType;
    private String title;
    private String url;           // Cloud storage URL
    private String fileName;
    private Long fileSize;        // Size in bytes
    private String description;
    
    // Metadata
    private LocalDateTime uploadedAt;
    private Integer downloadCount;

    public Material() {
        this.uploadedAt = LocalDateTime.now();
        this.downloadCount = 0;
    }

    // Enums
    public enum MaterialType {
        PDF,
        DOCUMENT,
        SLIDES,
        NOTES,
        CODE_SAMPLE,
        OTHER
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

    public MaterialType getMaterialType() {
        return materialType;
    }

    public void setMaterialType(MaterialType materialType) {
        this.materialType = materialType;
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

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public Integer getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(Integer downloadCount) {
        this.downloadCount = downloadCount;
    }

    // Helper method to increment download count
    public void incrementDownloadCount() {
        this.downloadCount++;
    }
}
