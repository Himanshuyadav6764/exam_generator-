package com.authsystem.controller;

import com.authsystem.service.CloudStorageService;
import com.authsystem.service.CourseService;
import com.authsystem.service.CourseDetailsService;
import com.authsystem.dto.CourseDetailsDTO;
import com.authsystem.dto.CourseCreationResponse;
import com.authsystem.model.Course;
import com.authsystem.model.SubContent;
import com.authsystem.model.TopicSubcontent;
import com.authsystem.model.TopicWithSubcontents;
import com.authsystem.model.MCQQuestion;
import com.authsystem.repository.CourseRepository;
import com.authsystem.repository.SubContentRepository;
import com.authsystem.repository.EnrollmentRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private SubContentRepository subContentRepository;
    
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    
    @Autowired
    private CloudStorageService cloudStorageService;
    
    @Autowired
    private CourseDetailsService courseDetailsService;
    
    @Autowired
    private CourseService courseService;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createCourse(@RequestBody Course course) {
        try {
            // Log authentication details
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            System.out.println("🔐 Auth Principal: " + auth.getPrincipal());
            System.out.println("🔐 Authorities: " + auth.getAuthorities());
            
            course.setCreatedAt(LocalDateTime.now());
            course.setUpdatedAt(LocalDateTime.now());
            
            // Log topicSubcontents info
            System.out.println("📝 Creating course: " + course.getTitle());
            if (course.getTopicSubcontents() != null) {
                System.out.println("  ✅ TopicSubcontents provided: " + course.getTopicSubcontents().size() + " topics");
                course.getTopicSubcontents().forEach((topic, subcontents) -> {
                    System.out.println("    📚 Topic: " + topic + " → " + subcontents.size() + " subcontents");
                    subcontents.forEach(sc -> {
                        System.out.println("      📝 Subcontent: " + sc.getName());
                        System.out.println("         Description: " + (sc.getDescription() != null && !sc.getDescription().isEmpty() ? "✅" : "❌"));
                        System.out.println("         Videos: " + (sc.getVideoUrls() != null ? sc.getVideoUrls().size() : 0));
                        System.out.println("         PDFs: " + (sc.getPdfUrls() != null ? sc.getPdfUrls().size() : 0));
                        System.out.println("         MCQs: " + sc.getMcqCount());
                    });
                });
            } else {
                System.out.println("  ⚠️ No topicSubcontents provided");
            }
            
            Course savedCourse = courseRepository.save(course);
            System.out.println("  ✅ Course saved with ID: " + savedCourse.getId());
            
            // Verify saved data
            if (savedCourse.getTopicSubcontents() != null && !savedCourse.getTopicSubcontents().isEmpty()) {
                System.out.println("  ✅ Confirmed: TopicSubcontents persisted successfully (" + savedCourse.getTopicSubcontents().size() + " topics)");
            } else {
                System.out.println("  ⚠️ WARNING: TopicSubcontents NOT persisted!");
            }
            
            return ResponseEntity.ok(savedCourse);
        } catch (Exception e) {
            System.err.println("❌ Error creating course: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating course: " + e.getMessage());
        }
    }
    
    /**
     * 🚀 NEW ATOMIC COURSE CREATION ENDPOINT
     * Creates course with DRAFT → PUBLISHED workflow
     * Waits for ALL file uploads to complete before marking as published
     * 
     * Frontend should call this endpoint with multipart/form-data:
     * - Basic fields: title, description, instructorEmail, instructorName, difficulty, topics
     * - topicSubcontents: JSON string with structure
     * - Files: courseThumbnail, topicVideos_{topicName}_{index}_0, topicPdfs_{topicName}_{index}_0, etc.
     */
    @PostMapping("/create-atomic")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createCourseAtomic(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("instructorEmail") String instructorEmail,
            @RequestParam("instructorName") String instructorName,
            @RequestParam(value = "difficulty", defaultValue = "BEGINNER") String difficulty,
            @RequestParam(value = "topics", required = false) String topicsJson,
            @RequestParam(value = "topicSubcontents", required = false) String topicSubcontentsJson,
            @RequestParam(value = "courseThumbnail", required = false) MultipartFile courseThumbnail,
            HttpServletRequest request
    ) {
        long startTime = System.currentTimeMillis();
        String courseId = null;
        
        try {
            System.out.println("\n🎯 ATOMIC COURSE CREATION REQUEST RECEIVED");
            System.out.println("   Title: " + title);
            System.out.println("   Instructor: " + instructorName);
            
            // Parse topics
            List<String> topics = new ArrayList<>();
            if (topicsJson != null && !topicsJson.isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                topics = mapper.readValue(topicsJson, new TypeReference<List<String>>() {});
            }
            
            // Parse topicSubcontents
            Map<String, List<TopicSubcontent>> topicSubcontents = new LinkedHashMap<>();
            if (topicSubcontentsJson != null && !topicSubcontentsJson.isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                topicSubcontents = mapper.readValue(topicSubcontentsJson, 
                    new TypeReference<Map<String, List<TopicSubcontent>>>() {});
            }
            
            // Extract file uploads from multipart request
            MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) request;
            
            // Organize video files by topic and subcontent index
            Map<String, Map<Integer, List<MultipartFile>>> videoFilesMap = new HashMap<>();
            // Organize PDF files by topic and subcontent index
            Map<String, Map<Integer, List<MultipartFile>>> pdfFilesMap = new HashMap<>();
            // Organize thumbnail files by topic and subcontent index
            Map<String, Map<Integer, MultipartFile>> thumbnailFilesMap = new HashMap<>();
            
            // Parse all file parameters
            for (String paramName : multipartRequest.getFileMap().keySet()) {
                TopicFileKey key;
                if (paramName.startsWith("topicVideos_")) {
                    key = parseTopicFileKey(paramName, "topicVideos_");
                    if (key != null) {
                        List<MultipartFile> files = multipartRequest.getFiles(paramName);
                        videoFilesMap.computeIfAbsent(key.topicName(), k -> new HashMap<>())
                                    .computeIfAbsent(key.subcontentIndex(), k -> new ArrayList<>())
                                    .addAll(files);
                    } else {
                        System.err.println("⚠️ Could not parse video parameter: " + paramName);
                    }
                } else if (paramName.startsWith("topicPdfs_")) {
                    key = parseTopicFileKey(paramName, "topicPdfs_");
                    if (key != null) {
                        List<MultipartFile> files = multipartRequest.getFiles(paramName);
                        pdfFilesMap.computeIfAbsent(key.topicName(), k -> new HashMap<>())
                                  .computeIfAbsent(key.subcontentIndex(), k -> new ArrayList<>())
                                  .addAll(files);
                    } else {
                        System.err.println("⚠️ Could not parse PDF parameter: " + paramName);
                    }
                } else if (paramName.startsWith("topicThumbnail_")) {
                    key = parseTopicFileKey(paramName, "topicThumbnail_");
                    if (key != null) {
                        MultipartFile file = multipartRequest.getFile(paramName);
                        thumbnailFilesMap.computeIfAbsent(key.topicName(), k -> new HashMap<>())
                                        .put(key.subcontentIndex(), file);
                    } else {
                        System.err.println("⚠️ Could not parse thumbnail parameter: " + paramName);
                    }
                }
            }
            
            // Call CourseService to handle atomic creation
            Course publishedCourse = courseService.createCourseWithFiles(
                title, description, instructorEmail, instructorName, difficulty,
                topics, topicSubcontents, courseThumbnail,
                videoFilesMap, pdfFilesMap, thumbnailFilesMap
            );
            
            courseId = publishedCourse.getId();
            long duration = System.currentTimeMillis() - startTime;
            
            // Build statistics
            CourseCreationResponse.UploadStatistics stats = new CourseCreationResponse.UploadStatistics();
            stats.setUploadDurationMs(duration);
            stats.setTotalTopics(publishedCourse.getTopics() != null ? publishedCourse.getTopics().size() : 0);
            
            int totalVideos = 0, totalPdfs = 0, totalThumbnails = 0, totalMcqs = 0, totalSubcontents = 0;
            if (publishedCourse.getTopicSubcontents() != null) {
                for (List<TopicSubcontent> scs : publishedCourse.getTopicSubcontents().values()) {
                    totalSubcontents += scs.size();
                    for (TopicSubcontent sc : scs) {
                        totalVideos += (sc.getVideoUrls() != null ? sc.getVideoUrls().size() : 0);
                        totalPdfs += (sc.getPdfUrls() != null ? sc.getPdfUrls().size() : 0);
                        totalThumbnails += (sc.getThumbnailUrl() != null ? 1 : 0);
                        totalMcqs += sc.getMcqCount();
                    }
                }
            }
            
            stats.setTotalVideos(totalVideos);
            stats.setTotalPdfs(totalPdfs);
            stats.setTotalThumbnails(totalThumbnails);
            stats.setTotalMcqs(totalMcqs);
            stats.setTotalSubcontents(totalSubcontents);
            
            // Build response
            CourseCreationResponse response = new CourseCreationResponse();
            response.setCourse(publishedCourse);
            response.setUploadStats(stats);
            response.setMessage("Course created and published successfully with all media uploaded");
            response.setSuccess(true);
            
            System.out.println("✅ ATOMIC COURSE CREATION COMPLETED");
            System.out.println("   Duration: " + duration + "ms (" + (duration/1000.0) + "s)");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ ATOMIC COURSE CREATION FAILED: " + e.getMessage());
            e.printStackTrace();
            
            // Rollback if course was created
            if (courseId != null) {
                courseService.rollbackCourse(courseId);
            }
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Course creation failed: " + e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Create course with file uploads (thumbnail, videos, PDFs)
     * Enhanced endpoint for course creation with multimedia content
     * 
     * @param title Course title
     * @param description Course description
     * @param instructorEmail Instructor's email
     * @param subjects List of subjects (comma-separated)
     * @param topics List of topics (comma-separated)
     * @param difficulty Course difficulty level
     * @param thumbnail Thumbnail image file
     * @param videos Array of video files
     * @param pdfs Array of PDF files
     * @return Created course with uploaded file URLs
     */
    @PostMapping("/create-with-files")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createCourseWithFiles(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("instructorEmail") String instructorEmail,
            @RequestParam(value = "subjects", required = false) String subjects,
            @RequestParam(value = "topics", required = false) String topics,
            @RequestParam(value = "difficulty", defaultValue = "BEGINNER") String difficulty,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail,
            @RequestParam(value = "videos", required = false) MultipartFile[] videos,
            @RequestParam(value = "pdfs", required = false) MultipartFile[] pdfs,
            @RequestParam(value = "topicSubcontents", required = false) String topicSubcontentsJson,
            HttpServletRequest request
    ) {
        try {
            // Create course object
            Course course = new Course();
            course.setTitle(title);
            course.setDescription(description);
            course.setInstructorEmail(instructorEmail);
            course.setDifficulty(difficulty);
            course.setStatus("DRAFT");
            course.setCreatedAt(LocalDateTime.now());
            course.setUpdatedAt(LocalDateTime.now());
            
            System.out.println("📝 Creating course with files: " + title);
            System.out.println("  Subjects param: " + subjects);
            System.out.println("  Topics param: " + topics);
            System.out.println("  Subjects is null? " + (subjects == null));
            System.out.println("  Topics is null? " + (topics == null));
            System.out.println("  Subjects is empty? " + (subjects != null && subjects.isEmpty()));
            System.out.println("  Topics is empty? " + (topics != null && topics.isEmpty()));
            
            // Parse subjects and topics
            if (subjects != null && !subjects.isEmpty()) {
                List<String> subjectList = Arrays.asList(subjects.split(","));
                course.setSubjects(subjectList);
                System.out.println("  ✅ Subjects set: " + subjectList);
            }
            if (topics != null && !topics.isEmpty()) {
                List<String> topicList = Arrays.asList(topics.split(","));
                course.setTopics(topicList);
                System.out.println("  ✅ Topics set: " + topicList);
            }
            
            // Upload thumbnail if provided
            String thumbnailUrl = null;
            if (thumbnail != null && !thumbnail.isEmpty()) {
                try {
                    thumbnailUrl = cloudStorageService.uploadFile(thumbnail, "course-thumbnails");
                    course.setThumbnail(thumbnailUrl);
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to upload thumbnail: " + e.getMessage()));
                }
            }
            
            // Initialize topicSubcontents Map if null - use LinkedHashMap for order preservation
            if (course.getTopicSubcontents() == null) {
                course.setTopicSubcontents(new java.util.LinkedHashMap<>());
            }
            
            // Save course first to get ID
            Course savedCourse = courseRepository.save(course);
            
            // Parse and save topicSubcontents if provided
            System.out.println("🔍 Checking topicSubcontents parameter:");
            System.out.println("  topicSubcontentsJson is null? " + (topicSubcontentsJson == null));
            System.out.println("  topicSubcontentsJson is empty? " + (topicSubcontentsJson != null && topicSubcontentsJson.isEmpty()));
            if (topicSubcontentsJson != null) {
                System.out.println("  topicSubcontentsJson length: " + topicSubcontentsJson.length());
                System.out.println("  topicSubcontentsJson preview: " + (topicSubcontentsJson.length() > 100 ? topicSubcontentsJson.substring(0, 100) + "..." : topicSubcontentsJson));
            }
            
            if (topicSubcontentsJson != null && !topicSubcontentsJson.isEmpty()) {
                try {
                    System.out.println("📥 Received topicSubcontents JSON:");
                    System.out.println(topicSubcontentsJson);
                    
                    ObjectMapper objectMapper = new ObjectMapper();
                    Map<String, List<TopicSubcontent>> topicSubcontents = objectMapper.readValue(
                        topicSubcontentsJson, 
                        new TypeReference<Map<String, List<TopicSubcontent>>>() {}
                    );
                    
                    System.out.println("✅ Parsed topicSubcontents successfully:");
                    System.out.println("  📦 Number of topics with subcontents: " + topicSubcontents.size());
                    topicSubcontents.forEach((topicName, subcontents) -> {
                        System.out.println("  📖 Topic key: '" + topicName + "' → " + subcontents.size() + " subcontents");
                        subcontents.forEach(sc -> {
                            System.out.println("    ├─ Subcontent name: " + sc.getName());
                            System.out.println("    ├─ Expected video files: " + (sc.getVideoFileNames() != null ? sc.getVideoFileNames().size() : 0));
                            System.out.println("    └─ Expected PDF files: " + (sc.getPdfFileNames() != null ? sc.getPdfFileNames().size() : 0));
                        });
                    });
                    
                    // Upload files for each topic's subcontents and update URLs
                    for (Map.Entry<String, List<TopicSubcontent>> entry : topicSubcontents.entrySet()) {
                        String topicName = entry.getKey();
                        List<TopicSubcontent> subcontents = entry.getValue();
                        
                        for (int scIndex = 0; scIndex < subcontents.size(); scIndex++) {
                            TopicSubcontent sc = subcontents.get(scIndex);
                            
                            // Upload videos for this subcontent
                            String videoParamPrefix = "topicVideos_" + topicName + "_" + scIndex;
                            if (request instanceof MultipartHttpServletRequest) {
                                MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) request;
                                List<MultipartFile> videoFiles = multipartRequest.getFiles(videoParamPrefix);
                                
                                if (videoFiles != null && !videoFiles.isEmpty()) {
                                    List<String> videoUrls = new ArrayList<>();
                                    for (MultipartFile videoFile : videoFiles) {
                                        if (videoFile != null && !videoFile.isEmpty()) {
                                            try {
                                                String videoUrl = cloudStorageService.uploadFile(videoFile, "course-topic-videos");
                                                videoUrls.add(videoUrl);
                                                System.out.println("✅ Uploaded video: " + videoFile.getOriginalFilename() + " -> " + videoUrl);
                                            } catch (Exception e) {
                                                System.err.println("⚠️ Failed to upload video: " + e.getMessage());
                                            }
                                        }
                                    }
                                    sc.setVideoUrls(videoUrls);
                                }
                                
                                // Upload PDFs for this subcontent
                                String pdfParamPrefix = "topicPdfs_" + topicName + "_" + scIndex;
                                List<MultipartFile> pdfFiles = multipartRequest.getFiles(pdfParamPrefix);
                                
                                if (pdfFiles != null && !pdfFiles.isEmpty()) {
                                    List<String> pdfUrls = new ArrayList<>();
                                    for (MultipartFile pdfFile : pdfFiles) {
                                        if (pdfFile != null && !pdfFile.isEmpty()) {
                                            try {
                                                String pdfUrl = cloudStorageService.uploadFile(pdfFile, "course-topic-pdfs");
                                                pdfUrls.add(pdfUrl);
                                                System.out.println("✅ Uploaded PDF: " + pdfFile.getOriginalFilename() + " -> " + pdfUrl);
                                            } catch (Exception e) {
                                                System.err.println("⚠️ Failed to upload PDF: " + e.getMessage());
                                            }
                                        }
                                    }
                                    sc.setPdfUrls(pdfUrls);
                                }
                                
                                // Upload thumbnail for this subcontent
                                String thumbnailParam = "topicThumbnail_" + topicName + "_" + scIndex;
                                MultipartFile thumbnailFile = multipartRequest.getFile(thumbnailParam);
                                if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
                                    try {
                                        String thumbUrl = cloudStorageService.uploadFile(thumbnailFile, "course-topic-thumbnails");
                                        sc.setThumbnailUrl(thumbUrl);
                                        System.out.println("✅ Uploaded thumbnail: " + thumbnailFile.getOriginalFilename() + " -> " + thumbUrl);
                                    } catch (Exception e) {
                                        System.err.println("⚠️ Failed to upload thumbnail: " + e.getMessage());
                                    }
                                }
                            }
                        }
                    }
                    
                    // Debug: Print what we're about to set
                    System.out.println("📝 Setting topicSubcontents on savedCourse:");
                    System.out.println("  Map object: " + topicSubcontents);
                    System.out.println("  Map size: " + topicSubcontents.size());
                    System.out.println("  Map class: " + topicSubcontents.getClass().getName());
                    topicSubcontents.forEach((key, value) -> {
                        System.out.println("    Key: '" + key + "' → " + value.size() + " subcontents");
                    });
                    
                    // Set the topicSubcontents Map directly
                    savedCourse.setTopicSubcontents(topicSubcontents);
                    
                    // FORCE updatedAt to trigger MongoDB update
                    savedCourse.setUpdatedAt(LocalDateTime.now());
                    
                    System.out.println("🔍 BEFORE MongoDB save:");
                    System.out.println("  savedCourse.getTopicSubcontents() == topicSubcontents? " + (savedCourse.getTopicSubcontents() == topicSubcontents));
                    System.out.println("  topicSubcontents Map size: " + savedCourse.getTopicSubcontents().size());
                    System.out.println("  topicSubcontents is null? " + (savedCourse.getTopicSubcontents() == null));
                    System.out.println("  topicSubcontents keys: " + savedCourse.getTopicSubcontents().keySet());
                    
                    // Update course with topicSubcontents including uploaded file URLs
                    savedCourse = courseRepository.save(savedCourse);
                    
                    System.out.println("🔍 AFTER MongoDB save:");
                    System.out.println("  Retrieved from DB - topicSubcontents size: " + (savedCourse.getTopicSubcontents() != null ? savedCourse.getTopicSubcontents().size() : 0));
                    if (savedCourse.getTopicSubcontents() != null) {
                        System.out.println("  Retrieved from DB - topicSubcontents keys: " + savedCourse.getTopicSubcontents().keySet());
                    }
                    System.out.println("✅ Saved topicSubcontents for " + topicSubcontents.size() + " topics with file URLs");
                    
                    // Verify data was saved correctly
                    System.out.println("🔍 Verifying saved topicSubcontents:");
                    topicSubcontents.forEach((topicName, subcontents) -> {
                        System.out.println("  📖 Topic: '" + topicName + "' → " + subcontents.size() + " subcontents");
                        subcontents.forEach(sc -> {
                            System.out.println("    ├─ Name: " + sc.getName());
                            System.out.println("    ├─ Description: " + (sc.getDescription() != null && !sc.getDescription().isEmpty() ? "✅ (" + sc.getDescription().length() + " chars)" : "❌ empty"));
                            System.out.println("    ├─ Videos: " + (sc.getVideoUrls() != null ? sc.getVideoUrls().size() + " files" : "0 files"));
                            System.out.println("    ├─ PDFs: " + (sc.getPdfUrls() != null ? sc.getPdfUrls().size() + " files" : "0 files"));
                            System.out.println("    ├─ Thumbnail: " + (sc.getThumbnailUrl() != null ? "✅" : "❌"));
                            System.out.println("    └─ MCQs: " + sc.getMcqCount() + " questions");
                        });
                    });
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to parse topicSubcontents: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.out.println("⚠️ WARNING: topicSubcontents NOT provided or is empty!");
                System.out.println("  This course will be saved WITHOUT any subcontent data.");
            }
            
            List<Map<String, Object>> uploadedVideos = new ArrayList<>();
            List<Map<String, Object>> uploadedPdfs = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            // Upload videos if provided
            if (videos != null && videos.length > 0) {
                for (int i = 0; i < videos.length; i++) {
                    MultipartFile video = videos[i];
                    if (video != null && !video.isEmpty()) {
                        try {
                            String videoUrl = cloudStorageService.uploadFile(video, "course-videos");
                            
                            // Create SubContent for video
                            SubContent subContent = new SubContent();
                            subContent.setCourseId(savedCourse.getId());
                            subContent.setTitle(video.getOriginalFilename());
                            subContent.setContentType("VIDEO");
                            subContent.setUrl(videoUrl);
                            subContent.setOrderIndex(i + 1);
                            subContent.setPreview(i == 0); // First video is preview
                            subContent.setCreatedAt(LocalDateTime.now());
                            
                            SubContent savedSubContent = subContentRepository.save(subContent);
                            
                            uploadedVideos.add(Map.of(
                                "id", savedSubContent.getId(),
                                "fileName", video.getOriginalFilename(),
                                "url", videoUrl,
                                "size", video.getSize(),
                                "order", i + 1
                            ));
                        } catch (Exception e) {
                            errors.add("Video " + (i + 1) + ": " + e.getMessage());
                        }
                    }
                }
            }
            
            // Upload PDFs if provided
            if (pdfs != null && pdfs.length > 0) {
                for (int i = 0; i < pdfs.length; i++) {
                    MultipartFile pdf = pdfs[i];
                    if (pdf != null && !pdf.isEmpty()) {
                        try {
                            String pdfUrl = cloudStorageService.uploadFile(pdf, "course-pdfs");
                            
                            // Create SubContent for PDF
                            SubContent subContent = new SubContent();
                            subContent.setCourseId(savedCourse.getId());
                            subContent.setTitle(pdf.getOriginalFilename());
                            subContent.setContentType("PDF");
                            subContent.setUrl(pdfUrl);
                            subContent.setOrderIndex(uploadedVideos.size() + i + 1);
                            subContent.setCreatedAt(LocalDateTime.now());
                            
                            SubContent savedSubContent = subContentRepository.save(subContent);
                            
                            uploadedPdfs.add(Map.of(
                                "id", savedSubContent.getId(),
                                "fileName", pdf.getOriginalFilename(),
                                "url", pdfUrl,
                                "size", pdf.getSize(),
                                "order", uploadedVideos.size() + i + 1
                            ));
                        } catch (Exception e) {
                            errors.add("PDF " + (i + 1) + ": " + e.getMessage());
                        }
                    }
                }
            }
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("course", savedCourse);
            response.put("thumbnail", thumbnailUrl);
            response.put("videos", uploadedVideos);
            response.put("pdfs", uploadedPdfs);
            
            // Calculate total videos and PDFs including those in topicSubcontents
            int totalVideos = uploadedVideos.size();
            int totalPdfs = uploadedPdfs.size();
            int totalSubcontents = 0;
            
            if (savedCourse.getTopicSubcontents() != null) {
                for (Map.Entry<String, List<TopicSubcontent>> entry : savedCourse.getTopicSubcontents().entrySet()) {
                    List<TopicSubcontent> subcontents = entry.getValue();
                    if (subcontents != null) {
                        for (TopicSubcontent sc : subcontents) {
                            totalSubcontents++;
                            if (sc.getVideoUrls() != null) {
                                totalVideos += sc.getVideoUrls().size();
                            }
                            if (sc.getPdfUrls() != null) {
                                totalPdfs += sc.getPdfUrls().size();
                            }
                        }
                    }
                }
            }
            
            response.put("videosCount", totalVideos);
            response.put("pdfsCount", totalPdfs);
            response.put("subcontentsCount", totalSubcontents);
            
            System.out.println("📊 Final Response Counts:");
            System.out.println("  Total Videos: " + totalVideos);
            System.out.println("  Total PDFs: " + totalPdfs);
            System.out.println("  Total Subcontents: " + totalSubcontents);
            System.out.println("  Topics with subcontents: " + (savedCourse.getTopicSubcontents() != null ? savedCourse.getTopicSubcontents().size() : 0));
            
            String successMsg = "Course created successfully";
            if (totalSubcontents > 0) {
                successMsg += " with " + totalSubcontents + " subtopic(s)";
            }
            if (totalVideos > 0 || totalPdfs > 0) {
                successMsg += ". Uploaded " + totalVideos + " video(s) and " + totalPdfs + " PDF(s) to Cloudinary";
            }
            response.put("message", successMsg);
            
            if (!errors.isEmpty()) {
                response.put("warnings", errors);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create course: " + e.getMessage()));
        }
    }
    
    /**
     * Update course with file uploads
     * Merges new topicSubcontents with existing ones
     * 
     * @param id Course ID to update
     * @param topicSubcontentsJson JSON string of new topicSubcontents
     * @param request HTTP request containing multipart files
     * @return Updated course with merged file URLs
     */
    @PutMapping("/update-with-files/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> updateCourseWithFiles(
            @PathVariable String id,
            @RequestParam(value = "topicSubcontents", required = false) String topicSubcontentsJson,
            HttpServletRequest request
    ) {
        try {
            // Find existing course
            Optional<Course> existingCourseOpt = courseRepository.findById(id);
            if (!existingCourseOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Course not found with ID: " + id));
            }
            
            Course existingCourse = existingCourseOpt.get();
            existingCourse.setUpdatedAt(LocalDateTime.now());
            
            // Parse new topicSubcontents if provided
            if (topicSubcontentsJson != null && !topicSubcontentsJson.isEmpty()) {
                try {
                    ObjectMapper objectMapper = new ObjectMapper();
                    Map<String, List<TopicSubcontent>> newTopicSubcontents = objectMapper.readValue(
                        topicSubcontentsJson, 
                        new TypeReference<Map<String, List<TopicSubcontent>>>() {}
                    );
                    
                    // Get existing topicSubcontents or create new map
                    Map<String, List<TopicSubcontent>> existingTopicSubcontents = existingCourse.getTopicSubcontents();
                    if (existingTopicSubcontents == null) {
                        existingTopicSubcontents = new HashMap<>();
                    }
                    
                    // Upload files for each topic's subcontents and update URLs
                    for (Map.Entry<String, List<TopicSubcontent>> entry : newTopicSubcontents.entrySet()) {
                        String topicName = entry.getKey();
                        List<TopicSubcontent> newSubcontents = entry.getValue();
                        
                        // Get existing subcontents for this topic
                        List<TopicSubcontent> existingSubcontents = existingTopicSubcontents.get(topicName);
                        if (existingSubcontents == null) {
                            existingSubcontents = new ArrayList<>();
                        }
                        
                        for (int scIndex = 0; scIndex < newSubcontents.size(); scIndex++) {
                            TopicSubcontent sc = newSubcontents.get(scIndex);
                            
                            // Upload videos for this subcontent
                            String videoParamPrefix = "topicVideos_" + topicName + "_" + scIndex;
                            if (request instanceof MultipartHttpServletRequest) {
                                MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) request;
                                List<MultipartFile> videoFiles = multipartRequest.getFiles(videoParamPrefix);
                                
                                if (videoFiles != null && !videoFiles.isEmpty()) {
                                    List<String> videoUrls = new ArrayList<>();
                                    for (MultipartFile videoFile : videoFiles) {
                                        if (videoFile != null && !videoFile.isEmpty()) {
                                            try {
                                                String videoUrl = cloudStorageService.uploadFile(videoFile, "course-topic-videos");
                                                videoUrls.add(videoUrl);
                                                System.out.println("✅ Uploaded video: " + videoFile.getOriginalFilename() + " -> " + videoUrl);
                                            } catch (Exception e) {
                                                System.err.println("⚠️ Failed to upload video: " + e.getMessage());
                                            }
                                        }
                                    }
                                    sc.setVideoUrls(videoUrls);
                                }
                                
                                // Upload PDFs for this subcontent
                                String pdfParamPrefix = "topicPdfs_" + topicName + "_" + scIndex;
                                List<MultipartFile> pdfFiles = multipartRequest.getFiles(pdfParamPrefix);
                                
                                if (pdfFiles != null && !pdfFiles.isEmpty()) {
                                    List<String> pdfUrls = new ArrayList<>();
                                    for (MultipartFile pdfFile : pdfFiles) {
                                        if (pdfFile != null && !pdfFile.isEmpty()) {
                                            try {
                                                String pdfUrl = cloudStorageService.uploadFile(pdfFile, "course-topic-pdfs");
                                                pdfUrls.add(pdfUrl);
                                                System.out.println("✅ Uploaded PDF: " + pdfFile.getOriginalFilename() + " -> " + pdfUrl);
                                            } catch (Exception e) {
                                                System.err.println("⚠️ Failed to upload PDF: " + e.getMessage());
                                            }
                                        }
                                    }
                                    sc.setPdfUrls(pdfUrls);
                                }
                                
                                // Upload thumbnail for this subcontent
                                String thumbnailParam = "topicThumbnail_" + topicName + "_" + scIndex;
                                MultipartFile thumbnailFile = multipartRequest.getFile(thumbnailParam);
                                if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
                                    try {
                                        String thumbUrl = cloudStorageService.uploadFile(thumbnailFile, "course-topic-thumbnails");
                                        sc.setThumbnailUrl(thumbUrl);
                                        System.out.println("✅ Uploaded thumbnail: " + thumbnailFile.getOriginalFilename() + " -> " + thumbUrl);
                                    } catch (Exception e) {
                                        System.err.println("⚠️ Failed to upload thumbnail: " + e.getMessage());
                                    }
                                }
                            }
                        }
                        
                        // Add new subcontents to existing ones
                        existingSubcontents.addAll(newSubcontents);
                        existingTopicSubcontents.put(topicName, existingSubcontents);
                    }
                    
                    existingCourse.setTopicSubcontents(existingTopicSubcontents);
                    
                    // Save updated course
                    Course updatedCourse = courseRepository.save(existingCourse);
                    System.out.println("✅ Updated course with topicSubcontents for " + existingTopicSubcontents.size() + " topics");
                    
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Course updated successfully",
                        "course", updatedCourse
                    ));
                    
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to parse topicSubcontents: " + e.getMessage());
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to parse topicSubcontents: " + e.getMessage()));
                }
            }
            
            // If no topicSubcontents provided, just update timestamp
            Course updatedCourse = courseRepository.save(existingCourse);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Course updated successfully",
                "course", updatedCourse
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update course: " + e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<Course>> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        System.out.println("📚 Total courses in DB: " + courses.size());
        for (Course course : courses) {
            System.out.println("  - " + course.getTitle() + " | Status: " + course.getStatus() + " | ID: " + course.getId());
        }
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/published")
    public ResponseEntity<List<Course>> getPublishedCourses() {
        List<Course> courses = courseRepository.findByStatus("PUBLISHED");
        System.out.println("📚 Found " + courses.size() + " published courses");
        for (Course course : courses) {
            System.out.println("  - " + course.getTitle() + " (status: " + course.getStatus() + ")");
        }
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable String id) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isPresent()) {
            Course course = courseOpt.get();
            System.out.println("🔍 Retrieved course: " + course.getTitle());
            System.out.println("  📚 Topics: " + (course.getTopics() != null ? course.getTopics().size() : 0));
            System.out.println("  🎯 TopicSubcontents: " + (course.getTopicSubcontents() != null ? course.getTopicSubcontents().size() : 0));
            
            if (course.getTopicSubcontents() != null) {
                course.getTopicSubcontents().forEach((topic, subtopics) -> {
                    System.out.println("    📖 Topic '" + topic + "' has " + (subtopics != null ? subtopics.size() : 0) + " subtopics");
                });
            } else {
                System.out.println("  ⚠️ WARNING: topicSubcontents is NULL for course " + course.getId());
            }
            
            return ResponseEntity.ok(course);
        }
        System.out.println("  ❌ Course not found with ID: " + id);
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/instructor/{email}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<List<Course>> getCoursesByInstructor(@PathVariable String email) {
        List<Course> courses = courseRepository.findByInstructorEmail(email);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Course>> getCoursesByStatus(@PathVariable String status) {
        List<Course> courses = courseRepository.findByStatus(status);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/difficulty/{difficulty}")
    public ResponseEntity<List<Course>> getCoursesByDifficulty(@PathVariable String difficulty) {
        List<Course> courses = courseRepository.findByDifficulty(difficulty);
        return ResponseEntity.ok(courses);
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> updateCourse(@PathVariable String id, @RequestBody Course courseDetails) {
        Optional<Course> courseOptional = courseRepository.findById(id);
        if (courseOptional.isPresent()) {
            Course course = courseOptional.get();
            
            // Only update fields that are provided (not null)
            if (courseDetails.getTitle() != null) {
                course.setTitle(courseDetails.getTitle());
            }
            if (courseDetails.getDescription() != null) {
                course.setDescription(courseDetails.getDescription());
            }
            if (courseDetails.getSubjects() != null) {
                course.setSubjects(courseDetails.getSubjects());
            }
            if (courseDetails.getTopics() != null) {
                course.setTopics(courseDetails.getTopics());
            }
            if (courseDetails.getDifficulty() != null) {
                course.setDifficulty(courseDetails.getDifficulty());
            }
            if (courseDetails.getThumbnail() != null) {
                course.setThumbnail(courseDetails.getThumbnail());
            }
            if (courseDetails.getStatus() != null) {
                course.setStatus(courseDetails.getStatus());
            }
            // CRITICAL: Preserve topicSubcontents - only update if explicitly provided
            if (courseDetails.getTopicSubcontents() != null) {
                course.setTopicSubcontents(courseDetails.getTopicSubcontents());
            }
            
            course.setUpdatedAt(LocalDateTime.now());
            
            Course updatedCourse = courseRepository.save(course);
            return ResponseEntity.ok(updatedCourse);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR') or hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteCourse(@PathVariable String id) {
        try {
            // Delete all enrollments for this course (removes from student panel)
            List<com.authsystem.model.Enrollment> enrollments = enrollmentRepository.findByCourseId(id);
            if (!enrollments.isEmpty()) {
                enrollmentRepository.deleteAll(enrollments);
                System.out.println("🗑️ Deleted " + enrollments.size() + " enrollments for course: " + id);
            }
            
            // Delete the course itself
            courseRepository.deleteById(id);
            System.out.println("🗑️ Course deleted: " + id);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Course deleted successfully",
                    "enrollmentsRemoved", enrollments.size()
            ));
        } catch (Exception e) {
            System.err.println("❌ Error deleting course: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Error deleting course: " + e.getMessage()
            ));
        }
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> publishCourse(@PathVariable String id) {
        Optional<Course> courseOptional = courseRepository.findById(id);
        if (courseOptional.isPresent()) {
            Course course = courseOptional.get();
            
            System.out.println("📢 Publishing course: " + course.getTitle());
            System.out.println("  📚 Topics: " + (course.getTopics() != null ? course.getTopics().size() : 0));
            System.out.println("  📚 Subjects: " + (course.getSubjects() != null ? course.getSubjects().size() : 0));
            System.out.println("  🎯 TopicSubcontents: " + (course.getTopicSubcontents() != null ? course.getTopicSubcontents().size() : 0));
            
            // Enhanced validation with detailed logging
            if (course.getTopicSubcontents() != null && !course.getTopicSubcontents().isEmpty()) {
                System.out.println("  ✅ TopicSubcontents structure:");
                
                for (Map.Entry<String, List<TopicSubcontent>> entry : course.getTopicSubcontents().entrySet()) {
                    String topicName = entry.getKey();
                    List<TopicSubcontent> subcontents = entry.getValue();
                    System.out.println("    📖 Topic: '" + topicName + "' → " + (subcontents != null ? subcontents.size() : 0) + " subcontents");
                    
                    if (subcontents != null) {
                        for (int i = 0; i < subcontents.size(); i++) {
                            TopicSubcontent sc = subcontents.get(i);
                            System.out.println("      📝 Subcontent #" + (i+1) + ": " + sc.getName());
                            System.out.println("         Description: " + (sc.getDescription() != null && !sc.getDescription().isEmpty() ? "✅" : "❌"));
                            System.out.println("         Videos: " + (sc.getVideoUrls() != null ? sc.getVideoUrls().size() : 0));
                            System.out.println("         PDFs: " + (sc.getPdfUrls() != null ? sc.getPdfUrls().size() : 0));
                            System.out.println("         MCQs: " + sc.getMcqCount());
                        }
                    }
                }
            } else if (course.getTopics() == null || course.getTopics().isEmpty()) {
                System.out.println("  ⚠️ WARNING: No topics found!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Cannot publish course without topics. Please add at least one topic.");
            } else {
                System.out.println("  ℹ️ Course has topics but no subcontents yet - allowing publish for draft mode");
            }
            
            // Only update status and timestamp - NEVER overwrite other fields
            course.setStatus("PUBLISHED");
            course.setUpdatedAt(LocalDateTime.now());
            courseRepository.save(course);
            
            System.out.println("  ✅ Course published successfully with all nested data preserved");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Course published successfully",
                "courseId", course.getId()
            ));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", "Course not found"));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchCourses(@RequestParam String query) {
        try {
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "courses", List.of(),
                    "topics", List.of(),
                    "totalResults", 0
                ));
            }
            
            String searchQuery = query.trim().toLowerCase();
            System.out.println("🔍 Searching for: " + searchQuery);
            
            // Search in courses
            List<Course> allCourses = courseRepository.findAll();
            List<Map<String, Object>> matchingCourses = new ArrayList<>();
            List<Map<String, Object>> matchingTopics = new ArrayList<>();
            
            for (Course course : allCourses) {
                boolean courseMatches = false;
                
                // Check if course title or description matches
                if (course.getTitle().toLowerCase().contains(searchQuery) ||
                    course.getDescription().toLowerCase().contains(searchQuery)) {
                    courseMatches = true;
                }
                
                // Check if any subject matches
                if (course.getSubjects() != null) {
                    for (String subject : course.getSubjects()) {
                        if (subject.toLowerCase().contains(searchQuery)) {
                            courseMatches = true;
                            break;
                        }
                    }
                }
                
                // Check if any topic matches
                if (course.getTopics() != null) {
                    for (String topic : course.getTopics()) {
                        if (topic.toLowerCase().contains(searchQuery)) {
                            courseMatches = true;
                            
                            // Add matching topic
                            Map<String, Object> topicMatch = new HashMap<>();
                            topicMatch.put("name", topic);
                            topicMatch.put("courseId", course.getId());
                            topicMatch.put("courseTitle", course.getTitle());
                            topicMatch.put("type", "topic");
                            matchingTopics.add(topicMatch);
                        }
                    }
                }
                
                // Check if any subcontent matches
                if (course.getTopicSubcontents() != null) {
                    for (Map.Entry<String, List<TopicSubcontent>> entry : course.getTopicSubcontents().entrySet()) {
                        String topicName = entry.getKey();
                        List<TopicSubcontent> subcontents = entry.getValue();
                        
                        if (topicName.toLowerCase().contains(searchQuery)) {
                            courseMatches = true;
                        }
                        
                        for (TopicSubcontent subcontent : subcontents) {
                            if (subcontent.getName().toLowerCase().contains(searchQuery) ||
                                (subcontent.getDescription() != null && 
                                 subcontent.getDescription().toLowerCase().contains(searchQuery))) {
                                courseMatches = true;
                                
                                // Add matching subcontent
                                Map<String, Object> subcontentMatch = new HashMap<>();
                                subcontentMatch.put("name", subcontent.getName());
                                subcontentMatch.put("description", subcontent.getDescription());
                                subcontentMatch.put("topicName", topicName);
                                subcontentMatch.put("courseId", course.getId());
                                subcontentMatch.put("courseTitle", course.getTitle());
                                subcontentMatch.put("type", "subcontent");
                                subcontentMatch.put("videoCount", subcontent.getVideoUrls() != null ? subcontent.getVideoUrls().size() : 0);
                                subcontentMatch.put("pdfCount", subcontent.getPdfUrls() != null ? subcontent.getPdfUrls().size() : 0);
                                matchingTopics.add(subcontentMatch);
                            }
                        }
                    }
                }
                
                if (courseMatches) {
                    Map<String, Object> courseData = new HashMap<>();
                    courseData.put("id", course.getId());
                    courseData.put("title", course.getTitle());
                    courseData.put("description", course.getDescription());
                    courseData.put("difficulty", course.getDifficulty());
                    courseData.put("instructorName", course.getInstructorName());
                    courseData.put("thumbnail", course.getThumbnail());
                    courseData.put("subjects", course.getSubjects());
                    courseData.put("status", course.getStatus());
                    courseData.put("type", "course");
                    matchingCourses.add(courseData);
                }
            }
            
            Map<String, Object> searchResults = new HashMap<>();
            searchResults.put("courses", matchingCourses);
            searchResults.put("topics", matchingTopics);
            searchResults.put("totalResults", matchingCourses.size() + matchingTopics.size());
            
            System.out.println("✅ Found " + matchingCourses.size() + " courses and " + matchingTopics.size() + " topics/subcontents");
            
            return ResponseEntity.ok(searchResults);
        } catch (Exception e) {
            System.err.println("❌ Search error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Search failed: " + e.getMessage()));
        }
    }
    
    // ============================================
    // NEW ENDPOINTS FOR COURSE DETAILS WITH COUNTS
    // ============================================
    
    /**
     * Get complete course details with all content counts
     * Used by both instructor and student panels
     */
    @GetMapping("/{id}/details")
    public ResponseEntity<?> getCourseDetails(@PathVariable String id) {
        try {
            System.out.println("\n📊 ========== GET COURSE DETAILS ==========");
            System.out.println("  📋 Course ID: " + id);
            
            // First, get the raw course from DB to debug
            Optional<Course> courseOpt = courseRepository.findById(id);
            if (courseOpt.isPresent()) {
                Course rawCourse = courseOpt.get();
                System.out.println("  ✅ Course found: " + rawCourse.getTitle());
                System.out.println("  📚 Topics list size: " + (rawCourse.getTopics() != null ? rawCourse.getTopics().size() : 0));
                System.out.println("  📦 TopicSubcontents map size: " + (rawCourse.getTopicSubcontents() != null ? rawCourse.getTopicSubcontents().size() : 0));
                
                if (rawCourse.getTopicSubcontents() != null && !rawCourse.getTopicSubcontents().isEmpty()) {
                    System.out.println("  🔍 TopicSubcontents details:");
                    rawCourse.getTopicSubcontents().forEach((topicName, subcontents) -> {
                        System.out.println("    📖 Topic: '" + topicName + "' → " + (subcontents != null ? subcontents.size() : 0) + " subcontents");
                        if (subcontents != null) {
                            subcontents.forEach(sc -> {
                                int videos = (sc.getVideoUrls() != null ? sc.getVideoUrls().size() : 0);
                                int pdfs = (sc.getPdfUrls() != null ? sc.getPdfUrls().size() : 0);
                                System.out.println("      ├─ " + sc.getName() + " (Videos: " + videos + ", PDFs: " + pdfs + ")");
                            });
                        }
                    });
                } else {
                    System.out.println("  ⚠️ WARNING: TopicSubcontents is NULL or EMPTY!");
                    System.out.println("  💡 This means the course was created without subcontent data");
                }
            } else {
                System.out.println("  ❌ Course not found!");
            }
            
            CourseDetailsDTO courseDetails = courseDetailsService.getCourseDetailsWithCounts(id);
            System.out.println("  ✅ Returning course details DTO");
            System.out.println("=========================================\n");
            return ResponseEntity.ok(courseDetails);
        } catch (Exception e) {
            System.err.println("❌ Error fetching course details: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch course details: " + e.getMessage()));
        }
    }
    
    /**
     * Get all published courses with content counts for students
     */
    @GetMapping("/published/details")
    public ResponseEntity<?> getPublishedCoursesWithDetails() {
        try {
            List<CourseDetailsDTO> courses = courseDetailsService.getPublishedCoursesWithCounts();
            System.out.println("📚 Returning " + courses.size() + " published courses with details");
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            System.err.println("❌ Error fetching published courses: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch published courses: " + e.getMessage()));
        }
    }
    
    /**
     * Get instructor's courses with content counts
     */
    @GetMapping("/instructor/{email}/details")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> getInstructorCoursesWithDetails(@PathVariable String email) {
        try {
            List<CourseDetailsDTO> courses = courseDetailsService.getInstructorCoursesWithCounts(email);
            System.out.println("📚 Returning " + courses.size() + " instructor courses with details");
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            System.err.println("❌ Error fetching instructor courses: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch instructor courses: " + e.getMessage()));
        }
    }

    /**
     * Toggle publish status of a specific subcontent
     * PATCH /api/courses/{courseId}/topics/{topicName}/subcontents/{subcontentIndex}/publish
     */
    @PatchMapping("/{courseId}/topics/{topicName}/subcontents/{subcontentIndex}/publish")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> toggleSubcontentPublish(
            @PathVariable String courseId,
            @PathVariable String topicName,
            @PathVariable int subcontentIndex,
            @RequestParam boolean published
    ) {
        try {
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (courseOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Course not found"));
            }
            
            Course course = courseOpt.get();
            Map<String, List<TopicSubcontent>> topicSubcontents = course.getTopicSubcontents();
            
            if (topicSubcontents == null || !topicSubcontents.containsKey(topicName)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Topic not found: " + topicName));
            }
            
            List<TopicSubcontent> subcontents = topicSubcontents.get(topicName);
            if (subcontentIndex < 0 || subcontentIndex >= subcontents.size()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Subcontent index out of bounds: " + subcontentIndex));
            }
            
            TopicSubcontent subcontent = subcontents.get(subcontentIndex);
            subcontent.setPublished(published);
            
            course.setUpdatedAt(LocalDateTime.now());
            courseRepository.save(course);
            
            System.out.println("✅ Toggled subcontent publish status:");
            System.out.println("   Course: " + courseId);
            System.out.println("   Topic: " + topicName);
            System.out.println("   Subcontent[" + subcontentIndex + "]: " + subcontent.getName());
            System.out.println("   Published: " + published);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Subcontent publish status updated",
                "published", published,
                "subcontentName", subcontent.getName()
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Error toggling subcontent publish: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update subcontent: " + e.getMessage()));
        }
    }

    private record TopicFileKey(String topicName, int subcontentIndex) {}

    private TopicFileKey parseTopicFileKey(String paramName, String prefix) {
        try {
            String payload = paramName.substring(prefix.length());
            int firstSeparator = payload.indexOf('_');
            if (firstSeparator <= 0) {
                return null;
            }

            String topicName = payload.substring(0, firstSeparator);
            String remainder = payload.substring(firstSeparator + 1);
            if (remainder.isEmpty()) {
                return null;
            }

            StringBuilder indexBuilder = new StringBuilder();
            for (int i = 0; i < remainder.length(); i++) {
                char ch = remainder.charAt(i);
                if (Character.isDigit(ch)) {
                    indexBuilder.append(ch);
                } else {
                    break; // stop at first non-digit (handles _fileIndex suffix)
                }
            }

            if (indexBuilder.length() == 0) {
                return null;
            }

            int subcontentIndex = Integer.parseInt(indexBuilder.toString());
            return new TopicFileKey(topicName, subcontentIndex);
        } catch (Exception ex) {
            System.err.println("⚠️ Failed to parse file parameter: " + paramName + " -> " + ex.getMessage());
            return null;
        }
    }
}

