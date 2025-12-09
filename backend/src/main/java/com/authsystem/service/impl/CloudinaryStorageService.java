package com.authsystem.service.impl;

import com.authsystem.service.CloudStorageService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Cloudinary implementation of CloudStorageService
 * Handles file uploads to Cloudinary (images, videos, PDFs)
 * 
 * This service is the default storage provider
 */
@Service
@ConditionalOnProperty(name = "cloud.storage.provider", havingValue = "cloudinary", matchIfMissing = true)
@Primary
public class CloudinaryStorageService implements CloudStorageService {
    
    private Cloudinary cloudinary;
    
    @Value("${cloudinary.cloud-name}")
    private String cloudName;
    
    @Value("${cloudinary.api-key}")
    private String apiKey;
    
    @Value("${cloudinary.api-secret}")
    private String apiSecret;
    
    /**
     * Initialize Cloudinary instance with credentials
     */
    private Cloudinary getCloudinary() {
        if (cloudinary == null) {
            System.out.println("🔧 Initializing Cloudinary:");
            System.out.println("  Cloud Name: " + cloudName);
            System.out.println("  API Key: " + apiKey);
            System.out.println("  API Secret: " + (apiSecret != null ? apiSecret.substring(0, 5) + "..." : "NULL"));
            
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
            ));
        }
        return cloudinary;
    }
    
    @Override
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty");
        }
        
        String fileName = file.getOriginalFilename();
        System.out.println("📤 [UPLOAD START] File: " + fileName + " | Size: " + file.getSize() + " bytes | Folder: " + folder);
        
        try {
            // Generate unique file name
            String uniqueFileName = generateUniqueFileName(fileName);
            
            // Determine resource type based on file type
            String resourceType = determineResourceType(file.getContentType());
            
            // Configure upload options - SYNCHRONOUS upload (NO eager_async)
            Map<String, Object> uploadOptions = ObjectUtils.asMap(
                "folder", folder,
                "public_id", uniqueFileName,
                "resource_type", resourceType,
                "overwrite", false,
                "use_filename", true,
                "timeout", 60000  // 60 second timeout for large files
            );
            
            // Add specific options based on file type
            if ("video".equals(resourceType)) {
                // REMOVED eager_async - we want synchronous processing
                uploadOptions.put("chunk_size", 6000000); // 6MB chunks for reliable upload
                System.out.println("  📹 Video upload mode - synchronous processing");
            } else if ("image".equals(resourceType)) {
                uploadOptions.put("quality", "auto:good");
                System.out.println("  🖼️ Image upload mode");
            } else if ("raw".equals(resourceType)) {
                System.out.println("  📄 PDF/Document upload mode");
            }
            
            long startTime = System.currentTimeMillis();
            
            System.out.println("  🔄 Uploading to Cloudinary...");
            System.out.println("     Options: " + uploadOptions);
            
            // Upload to Cloudinary - THIS BLOCKS UNTIL COMPLETE
            Map uploadResult = getCloudinary().uploader().upload(
                file.getBytes(), 
                uploadOptions
            );
            
            long duration = System.currentTimeMillis() - startTime;
            String secureUrl = (String) uploadResult.get("secure_url");
            
            System.out.println("✅ [UPLOAD SUCCESS] " + fileName + " → " + secureUrl);
            System.out.println("   Duration: " + duration + "ms");
            
            // Return the secure URL
            return secureUrl;
            
        } catch (Exception e) {
            System.err.println("❌ [UPLOAD FAILED] " + fileName);
            System.err.println("   Error Type: " + e.getClass().getName());
            System.err.println("   Message: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }
    
    @Override
    public boolean deleteFile(String fileUrl) {
        try {
            // Extract public_id from Cloudinary URL
            // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
            String publicId = extractPublicIdFromUrl(fileUrl);
            
            if (publicId == null || publicId.isEmpty()) {
                System.err.println("Could not extract public_id from URL: " + fileUrl);
                return false;
            }
            
            // Determine resource type from URL
            String resourceType = extractResourceTypeFromUrl(fileUrl);
            
            // Delete from Cloudinary
            Map result = getCloudinary().uploader().destroy(
                publicId, 
                ObjectUtils.asMap("resource_type", resourceType)
            );
            
            String resultStatus = (String) result.get("result");
            return "ok".equals(resultStatus) || "not found".equals(resultStatus);
            
        } catch (Exception e) {
            System.err.println("Failed to delete file from Cloudinary: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Determine Cloudinary resource type based on content type
     */
    private String determineResourceType(String contentType) {
        if (contentType == null) {
            return "auto";
        }
        
        if (contentType.startsWith("video/")) {
            return "video";
        } else if (contentType.startsWith("image/")) {
            return "image";
        } else if (contentType.equals("application/pdf")) {
            return "raw"; // Use raw for PDFs to avoid transformation issues
        } else {
            return "raw"; // For other file types (documents, etc.)
        }
    }
    
    /**
     * Check if the file is a PDF
     */
    private boolean isPdfFile(String contentType) {
        return contentType != null && contentType.equals("application/pdf");
    }
    
    /**
     * Extract public_id from Cloudinary URL
     * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
     * Returns: sample (without folder prefix and version)
     */
    private String extractPublicIdFromUrl(String fileUrl) {
        try {
            // Find the position after /upload/
            int uploadIndex = fileUrl.indexOf("/upload/");
            if (uploadIndex == -1) {
                return null;
            }
            
            // Get substring after /upload/
            String afterUpload = fileUrl.substring(uploadIndex + 8);
            
            // Remove version if present (starts with v followed by numbers)
            if (afterUpload.matches("^v\\d+/.*")) {
                int slashIndex = afterUpload.indexOf("/");
                afterUpload = afterUpload.substring(slashIndex + 1);
            }
            
            // Remove file extension
            int lastDotIndex = afterUpload.lastIndexOf(".");
            if (lastDotIndex > 0) {
                afterUpload = afterUpload.substring(0, lastDotIndex);
            }
            
            return afterUpload;
            
        } catch (Exception e) {
            System.err.println("Error extracting public_id: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Extract resource type from Cloudinary URL
     */
    private String extractResourceTypeFromUrl(String fileUrl) {
        if (fileUrl.contains("/video/")) {
            return "video";
        } else if (fileUrl.contains("/image/")) {
            return "image";
        } else if (fileUrl.contains("/raw/")) {
            return "raw";
        }
        return "image"; // Default
    }
}
