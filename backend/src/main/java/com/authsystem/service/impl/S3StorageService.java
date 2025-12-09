package com.authsystem.service.impl;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.authsystem.service.CloudStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;

/**
 * AWS S3 implementation of CloudStorageService
 * Handles file uploads to Amazon S3 bucket
 * Only enabled when cloud.storage.provider=s3
 */
@Service
@ConditionalOnProperty(name = "cloud.storage.provider", havingValue = "s3")
public class S3StorageService implements CloudStorageService {
    
    @Value("${cloud.aws.s3.bucket}")
    private String bucketName;
    
    @Value("${cloud.aws.region}")
    private String region;
    
    @Value("${cloud.aws.credentials.access-key}")
    private String accessKey;
    
    @Value("${cloud.aws.credentials.secret-key}")
    private String secretKey;
    
    private AmazonS3 s3Client;
    
    /**
     * Initialize S3 client with credentials
     */
    private AmazonS3 getS3Client() {
        if (s3Client == null) {
            BasicAWSCredentials awsCredentials = new BasicAWSCredentials(accessKey, secretKey);
            s3Client = AmazonS3ClientBuilder
                    .standard()
                    .withRegion(region)
                    .withCredentials(new AWSStaticCredentialsProvider(awsCredentials))
                    .build();
        }
        return s3Client;
    }
    
    @Override
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty");
        }
        
        // Generate unique file name
        String uniqueFileName = generateUniqueFileName(file.getOriginalFilename());
        String key = folder + "/" + uniqueFileName;
        
        // Set file metadata
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());
        
        // Upload to S3
        try {
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    bucketName, 
                    key, 
                    file.getInputStream(), 
                    metadata
            );
            
            // Make file publicly readable (or use signed URLs for private access)
            putObjectRequest.withCannedAcl(CannedAccessControlList.PublicRead);
            
            getS3Client().putObject(putObjectRequest);
            
            // Return the public URL
            return getS3Client().getUrl(bucketName, key).toString();
            
        } catch (Exception e) {
            throw new IOException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }
    
    @Override
    public boolean deleteFile(String fileUrl) {
        try {
            // Extract key from URL
            URL url = new URL(fileUrl);
            String key = url.getPath().substring(1); // Remove leading '/'
            
            DeleteObjectRequest deleteObjectRequest = new DeleteObjectRequest(bucketName, key);
            getS3Client().deleteObject(deleteObjectRequest);
            
            return true;
        } catch (Exception e) {
            System.err.println("Failed to delete file from S3: " + e.getMessage());
            return false;
        }
    }
}
