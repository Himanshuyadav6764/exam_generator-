package com.authsystem.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Interface for cloud storage operations
 * Supports multiple cloud providers: AWS S3, Azure Blob, Google Cloud Storage
 */
public interface CloudStorageService {
    
    /**
     * Upload a file to cloud storage
     * @param file The file to upload
     * @param folder The folder path (e.g., "thumbnails", "videos", "pdfs")
     * @return The public URL of the uploaded file
     * @throws IOException If upload fails
     */
    String uploadFile(MultipartFile file, String folder) throws IOException;
    
    /**
     * Delete a file from cloud storage
     * @param fileUrl The URL of the file to delete
     * @return true if deleted successfully
     */
    boolean deleteFile(String fileUrl);
    
    /**
     * Generate a unique file name to avoid conflicts
     * @param originalFilename The original file name
     * @return A unique file name with timestamp
     */
    default String generateUniqueFileName(String originalFilename) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String extension = "";
        
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            originalFilename = originalFilename.substring(0, originalFilename.lastIndexOf("."));
        }
        
        // Clean filename: remove special characters
        String cleanName = originalFilename.replaceAll("[^a-zA-Z0-9-_]", "_");
        
        return cleanName + "_" + timestamp + extension;
    }
}
