package com.authsystem.service;

import com.authsystem.model.Course;
import com.authsystem.model.TopicSubcontent;
import com.authsystem.model.MCQQuestion;
import com.authsystem.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Course Service - Handles course creation with atomic DRAFT → PUBLISHED workflow
 * Ensures all file uploads complete before marking course as published
 */
@Service
public class CourseService {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private CloudStorageService cloudStorageService;
    
    /**
     * Create course with synchronous file uploads
     * Step 1: Save course as DRAFT
     * Step 2: Upload all files synchronously
     * Step 3: Update course with file URLs
     * Step 4: Mark as PUBLISHED and save
     * 
     * @return Course with all uploaded file URLs and PUBLISHED status
     */
    public Course createCourseWithFiles(
            String title,
            String description,
            String instructorEmail,
            String instructorName,
            String difficulty,
            List<String> topics,
            Map<String, List<TopicSubcontent>> topicSubcontents,
            MultipartFile courseThumbnail,
            Map<String, Map<Integer, List<MultipartFile>>> videoFilesMap,
            Map<String, Map<Integer, List<MultipartFile>>> pdfFilesMap,
            Map<String, Map<Integer, MultipartFile>> thumbnailFilesMap
    ) throws Exception {
        
        System.out.println("\n" + "=".repeat(80));
        System.out.println("🚀 STARTING COURSE CREATION WITH ATOMIC WORKFLOW");
        System.out.println("=".repeat(80));
        System.out.println("📚 Course: " + title);
        System.out.println("👤 Instructor: " + instructorName + " (" + instructorEmail + ")");
        System.out.println("📝 Topics: " + (topics != null ? topics.size() : 0));
        System.out.println("📦 Topic Subcontents: " + (topicSubcontents != null ? topicSubcontents.size() : 0));
        
        // STEP 1: Create course in DRAFT state
        System.out.println("\n📝 [STEP 1] Creating course in DRAFT state...");
        Course course = new Course();
        course.setTitle(title);
        course.setDescription(description);
        course.setInstructorEmail(instructorEmail);
        course.setInstructorName(instructorName);
        course.setDifficulty(difficulty);
        course.setTopics(topics);
        course.setStatus("DRAFT");
        course.setCreatedAt(LocalDateTime.now());
        course.setUpdatedAt(LocalDateTime.now());
        
        // Initialize empty topicSubcontents map (will populate after uploads)
        course.setTopicSubcontents(new LinkedHashMap<>());
        
        Course savedCourse = courseRepository.save(course);
        System.out.println("✅ Course saved as DRAFT | ID: " + savedCourse.getId());
        
        // STEP 2: Upload course thumbnail (if provided)
        if (courseThumbnail != null && !courseThumbnail.isEmpty()) {
            System.out.println("\n🖼️ [STEP 2] Uploading course thumbnail...");
            try {
                String thumbnailUrl = cloudStorageService.uploadFile(courseThumbnail, "course-thumbnails");
                savedCourse.setThumbnail(thumbnailUrl);
                System.out.println("✅ Course thumbnail uploaded: " + thumbnailUrl);
            } catch (Exception e) {
                System.err.println("⚠️ Course thumbnail upload failed: " + e.getMessage());
                // Continue even if thumbnail fails
            }
        }
        
        // STEP 3: Upload all topic subcontent files SYNCHRONOUSLY
        System.out.println("\n📤 [STEP 3] Uploading all topic subcontent files...");
        
        if (topicSubcontents != null && !topicSubcontents.isEmpty()) {
            Map<String, List<TopicSubcontent>> processedSubcontents = new LinkedHashMap<>();
            
            int topicCounter = 0;
            for (Map.Entry<String, List<TopicSubcontent>> entry : topicSubcontents.entrySet()) {
                String topicName = entry.getKey();
                List<TopicSubcontent> subcontents = entry.getValue();
                
                topicCounter++;
                System.out.println("\n📖 [Topic " + topicCounter + "/" + topicSubcontents.size() + "] " + topicName);
                System.out.println("   Subcontents: " + subcontents.size());
                
                List<TopicSubcontent> processedSubcontentsList = new ArrayList<>();
                
                for (int scIndex = 0; scIndex < subcontents.size(); scIndex++) {
                    TopicSubcontent subcontent = subcontents.get(scIndex);
                    System.out.println("\n   📝 [Subcontent " + (scIndex + 1) + "] " + subcontent.getName());
                    
                    // Upload videos for this subcontent
                    if (videoFilesMap != null && videoFilesMap.containsKey(topicName)) {
                        Map<Integer, List<MultipartFile>> topicVideos = videoFilesMap.get(topicName);
                        if (topicVideos.containsKey(scIndex)) {
                            List<MultipartFile> videos = topicVideos.get(scIndex);
                            if (videos != null && !videos.isEmpty()) {
                                System.out.println("      📹 Uploading " + videos.size() + " video(s)...");
                                List<String> videoUrls = new ArrayList<>();
                                List<String> videoFileNames = new ArrayList<>();
                                
                                for (int i = 0; i < videos.size(); i++) {
                                    MultipartFile video = videos.get(i);
                                    if (video != null && !video.isEmpty()) {
                                        try {
                                            System.out.println("         [" + (i+1) + "/" + videos.size() + "] " + video.getOriginalFilename());
                                            String videoUrl = cloudStorageService.uploadFile(video, "course-topic-videos");
                                            videoUrls.add(videoUrl);
                                            videoFileNames.add(video.getOriginalFilename());
                                        } catch (Exception e) {
                                            System.err.println("         ❌ Upload failed: " + e.getMessage());
                                            throw new Exception("Video upload failed for " + video.getOriginalFilename() + ": " + e.getMessage());
                                        }
                                    }
                                }
                                subcontent.setVideoUrls(videoUrls);
                                subcontent.setVideoFileNames(videoFileNames);
                                System.out.println("      ✅ All videos uploaded successfully");
                            }
                        }
                    }
                    
                    // Upload PDFs for this subcontent
                    if (pdfFilesMap != null && pdfFilesMap.containsKey(topicName)) {
                        Map<Integer, List<MultipartFile>> topicPdfs = pdfFilesMap.get(topicName);
                        if (topicPdfs.containsKey(scIndex)) {
                            List<MultipartFile> pdfs = topicPdfs.get(scIndex);
                            if (pdfs != null && !pdfs.isEmpty()) {
                                System.out.println("      📄 Uploading " + pdfs.size() + " PDF(s)...");
                                List<String> pdfUrls = new ArrayList<>();
                                List<String> pdfFileNames = new ArrayList<>();
                                
                                for (int i = 0; i < pdfs.size(); i++) {
                                    MultipartFile pdf = pdfs.get(i);
                                    if (pdf != null && !pdf.isEmpty()) {
                                        try {
                                            System.out.println("         [" + (i+1) + "/" + pdfs.size() + "] " + pdf.getOriginalFilename());
                                            String pdfUrl = cloudStorageService.uploadFile(pdf, "course-topic-pdfs");
                                            pdfUrls.add(pdfUrl);
                                            pdfFileNames.add(pdf.getOriginalFilename());
                                        } catch (Exception e) {
                                            System.err.println("         ❌ Upload failed: " + e.getMessage());
                                            throw new Exception("PDF upload failed for " + pdf.getOriginalFilename() + ": " + e.getMessage());
                                        }
                                    }
                                }
                                subcontent.setPdfUrls(pdfUrls);
                                subcontent.setPdfFileNames(pdfFileNames);
                                System.out.println("      ✅ All PDFs uploaded successfully");
                            }
                        }
                    }
                    
                    // Upload thumbnail for this subcontent
                    if (thumbnailFilesMap != null && thumbnailFilesMap.containsKey(topicName)) {
                        Map<Integer, MultipartFile> topicThumbnails = thumbnailFilesMap.get(topicName);
                        if (topicThumbnails.containsKey(scIndex)) {
                            MultipartFile thumbnail = topicThumbnails.get(scIndex);
                            if (thumbnail != null && !thumbnail.isEmpty()) {
                                try {
                                    System.out.println("      🖼️ Uploading thumbnail: " + thumbnail.getOriginalFilename());
                                    String thumbnailUrl = cloudStorageService.uploadFile(thumbnail, "course-topic-thumbnails");
                                    subcontent.setThumbnailUrl(thumbnailUrl);
                                    subcontent.setThumbnailFileName(thumbnail.getOriginalFilename());
                                    System.out.println("      ✅ Thumbnail uploaded successfully");
                                } catch (Exception e) {
                                    System.err.println("      ⚠️ Thumbnail upload failed: " + e.getMessage());
                                    // Continue even if thumbnail fails
                                }
                            }
                        }
                    }
                    
                    // Mark subcontent as published since course will be published
                    subcontent.setPublished(true);
                    
                    processedSubcontentsList.add(subcontent);
                }
                
                processedSubcontents.put(topicName, processedSubcontentsList);
            }
            
            // STEP 4: Update course with all uploaded file URLs
            System.out.println("\n💾 [STEP 4] Updating course with subcontent data...");
            savedCourse.setTopicSubcontents(processedSubcontents);
            savedCourse.setUpdatedAt(LocalDateTime.now());
            
            // Print summary
            System.out.println("   📊 Summary:");
            processedSubcontents.forEach((topic, scs) -> {
                System.out.println("      📖 " + topic + ": " + scs.size() + " subcontent(s)");
                scs.forEach(sc -> {
                    int videos = sc.getVideoUrls() != null ? sc.getVideoUrls().size() : 0;
                    int pdfs = sc.getPdfUrls() != null ? sc.getPdfUrls().size() : 0;
                    int mcqs = sc.getMcqCount();
                    System.out.println("         • " + sc.getName() + ": " + videos + " video(s), " + pdfs + " PDF(s), " + mcqs + " MCQ(s)");
                });
            });
        }
        
        // STEP 5: Mark course as PUBLISHED and save
        System.out.println("\n📢 [STEP 5] Publishing course...");
        savedCourse.setStatus("PUBLISHED");
        savedCourse.setUpdatedAt(LocalDateTime.now());
        
        Course publishedCourse = courseRepository.save(savedCourse);
        
        System.out.println("✅ Course PUBLISHED successfully!");
        System.out.println("   ID: " + publishedCourse.getId());
        System.out.println("   Status: " + publishedCourse.getStatus());
        System.out.println("   Topics with subcontents: " + 
            (publishedCourse.getTopicSubcontents() != null ? publishedCourse.getTopicSubcontents().size() : 0));
        System.out.println("=".repeat(80) + "\n");
        
        return publishedCourse;
    }
    
    /**
     * Rollback course creation (delete from database)
     * Called if file uploads fail midway
     */
    public void rollbackCourse(String courseId) {
        try {
            System.err.println("🔄 Rolling back course: " + courseId);
            courseRepository.deleteById(courseId);
            System.err.println("✅ Course deleted from database");
        } catch (Exception e) {
            System.err.println("❌ Rollback failed: " + e.getMessage());
        }
    }
}
