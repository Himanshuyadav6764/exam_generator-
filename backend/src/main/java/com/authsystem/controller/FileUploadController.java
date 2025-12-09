package com.authsystem.controller;

import com.authsystem.service.CloudStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

/**
 * REST Controller for file upload operations
 * Handles thumbnail, video, and PDF uploads to cloud storage
 */
@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "*"}, maxAge = 3600)
public class FileUploadController {
    
    @Autowired
    private CloudStorageService cloudStorageService;
    
    // Maximum file sizes (in bytes)
    private static final long MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB
    private static final long MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
    private static final long MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
    
    /**
     * Upload course thumbnail image
     * @param file The image file (JPG, PNG, WEBP, GIF)
     * @return File URL and metadata
     */
    @PostMapping("/upload/thumbnail")
    public ResponseEntity<?> uploadThumbnail(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            
            // Check file size
            if (file.getSize() > MAX_THUMBNAIL_SIZE) {
                return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 5MB limit"));
            }
            
            // Check file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "File must be an image"));
            }
            
            // Upload to cloud storage
            String fileUrl = cloudStorageService.uploadFile(file, "thumbnails");
            
            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", fileUrl);
            response.put("fileName", file.getOriginalFilename());
            response.put("fileSize", file.getSize());
            response.put("contentType", contentType);
            response.put("uploadedAt", new Date());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ PDF upload failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
    
    /**
     * Upload course thumbnail (for future use)
     * @param file The video file (MP4, AVI, MOV, MKV, WEBM)
     * @return File URL and metadata
     */
    @PostMapping("/upload/video")
    public ResponseEntity<?> uploadVideo(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            
            // Check file size
            if (file.getSize() > MAX_VIDEO_SIZE) {
                return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 500MB limit"));
            }
            
            // Check file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("video/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "File must be a video"));
            }
            
            // Upload to cloud storage
            String fileUrl = cloudStorageService.uploadFile(file, "videos");
            
            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", fileUrl);
            response.put("fileName", file.getOriginalFilename());
            response.put("fileSize", file.getSize());
            response.put("contentType", contentType);
            response.put("uploadedAt", new Date());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Video upload failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
    
    /**
     * Upload multiple videos at once
     * @param files Array of video files
     * @return List of file URLs and metadata
     */
    @PostMapping("/upload/videos")
    public ResponseEntity<?> uploadMultipleVideos(@RequestParam("files") MultipartFile[] files) {
        try {
            if (files == null || files.length == 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "No files provided"));
            }
            
            List<Map<String, Object>> uploadedFiles = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (MultipartFile file : files) {
                try {
                    // Validate each file
                    if (file.getSize() > MAX_VIDEO_SIZE) {
                        errors.add(file.getOriginalFilename() + ": File size exceeds 500MB limit");
                        continue;
                    }
                    
                    String contentType = file.getContentType();
                    if (contentType == null || !contentType.startsWith("video/")) {
                        errors.add(file.getOriginalFilename() + ": File must be a video");
                        continue;
                    }
                    
                    // Upload to cloud storage
                    String fileUrl = cloudStorageService.uploadFile(file, "videos");
                    
                    Map<String, Object> fileInfo = new HashMap<>();
                    fileInfo.put("url", fileUrl);
                    fileInfo.put("fileName", file.getOriginalFilename());
                    fileInfo.put("fileSize", file.getSize());
                    fileInfo.put("contentType", contentType);
                    
                    uploadedFiles.add(fileInfo);
                    
                } catch (Exception e) {
                    errors.add(file.getOriginalFilename() + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("uploadedFiles", uploadedFiles);
            response.put("uploadedCount", uploadedFiles.size());
            response.put("failedCount", errors.size());
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
    
    /**
     * Upload PDF document
     * @param file The PDF file
     * @return File URL and metadata
     */
    @PostMapping("/upload/pdf")
    public ResponseEntity<?> uploadPdf(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            
            // Check file size
            if (file.getSize() > MAX_PDF_SIZE) {
                return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 50MB limit"));
            }
            
            // Check file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.equals("application/pdf")) {
                return ResponseEntity.badRequest().body(Map.of("error", "File must be a PDF"));
            }
            
            // Upload to cloud storage
            String fileUrl = cloudStorageService.uploadFile(file, "pdfs");
            
            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", fileUrl);
            response.put("fileName", file.getOriginalFilename());
            response.put("fileSize", file.getSize());
            response.put("contentType", contentType);
            response.put("uploadedAt", new Date());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
    
    /**
     * Delete a file from cloud storage
     * @param fileUrl The URL of the file to delete
     * @return Success status
     */
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteFile(@RequestParam("url") String fileUrl) {
        try {
            boolean deleted = cloudStorageService.deleteFile(fileUrl);
            
            if (deleted) {
                return ResponseEntity.ok(Map.of("success", true, "message", "File deleted successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to delete file"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }
}
