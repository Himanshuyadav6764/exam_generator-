package com.authsystem.controller;

import com.authsystem.model.Video;
import com.authsystem.model.Topic;
import com.authsystem.model.Subject;
import com.authsystem.repository.VideoRepository;
import com.authsystem.repository.TopicRepository;
import com.authsystem.repository.SubjectRepository;
import com.authsystem.service.impl.CloudinaryStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/**
 * VideoController - Handles Video content CRUD operations
 * Videos belong to topics and can have preview flags for free access
 */
@RestController
@RequestMapping("/api/videos")
@CrossOrigin(origins = "*")
public class VideoController {

    @Autowired
    private VideoRepository videoRepository;
    
    @Autowired
    private TopicRepository topicRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private CloudinaryStorageService cloudStorageService;

    /**
     * POST /api/videos/create
     * Create video without file upload (URL provided)
     */
    @PostMapping("/create")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createVideo(@RequestBody Video video) {
        try {
            // Validate required fields
            if (video.getTopicId() == null || video.getTopicId().isEmpty()) {
                return ResponseEntity.badRequest().body("Topic ID is required");
            }
            if (video.getTitle() == null || video.getTitle().isEmpty()) {
                return ResponseEntity.badRequest().body("Video title is required");
            }
            if (video.getUrl() == null || video.getUrl().isEmpty()) {
                return ResponseEntity.badRequest().body("Video URL is required");
            }
            
            // Verify topic exists and get its details
            Optional<Topic> topicOptional = topicRepository.findById(video.getTopicId());
            if (!topicOptional.isPresent()) {
                return ResponseEntity.badRequest().body("Topic not found");
            }
            
            Topic topic = topicOptional.get();
            
            // Set subjectId from topic
            video.setSubjectId(topic.getSubjectId());
            
            // If difficulty not provided, inherit from topic
            if (video.getDifficulty() == null || video.getDifficulty().isEmpty()) {
                video.setDifficulty(topic.getDifficulty());
            } else {
                // Validate difficulty matches topic
                if (!video.getDifficulty().equals(topic.getDifficulty())) {
                    return ResponseEntity.badRequest()
                        .body("Video difficulty must match topic difficulty: " + topic.getDifficulty());
                }
            }
            
            // Set timestamps
            video.setCreatedAt(LocalDateTime.now());
            video.setUpdatedAt(LocalDateTime.now());
            
            // Set default values
            if (video.getIsPreview() == null) {
                video.setIsPreview(false);
            }
            if (video.getOrderIndex() == null) {
                Long count = videoRepository.countByTopicId(video.getTopicId());
                video.setOrderIndex(count.intValue() + 1);
            }
            
            Video savedVideo = videoRepository.save(video);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedVideo);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating video: " + e.getMessage());
        }
    }

    /**
     * POST /api/videos/upload
     * Upload video file to Cloudinary and create video record
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("topicId") String topicId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "duration", required = false) Integer duration,
            @RequestParam(value = "isPreview", defaultValue = "false") Boolean isPreview) {
        try {
            // Verify topic exists
            Optional<Topic> topicOptional = topicRepository.findById(topicId);
            if (!topicOptional.isPresent()) {
                return ResponseEntity.badRequest().body("Topic not found");
            }
            
            Topic topic = topicOptional.get();
            
            // Upload video to Cloudinary
            String videoUrl = cloudStorageService.uploadFile(file, "videos");
            
            // Create video record
            Video video = new Video();
            video.setTopicId(topicId);
            video.setSubjectId(topic.getSubjectId());
            video.setTitle(title);
            video.setDescription(description);
            video.setUrl(videoUrl);
            video.setDifficulty(topic.getDifficulty());
            video.setDuration(duration);
            video.setIsPreview(isPreview);
            video.setCreatedAt(LocalDateTime.now());
            video.setUpdatedAt(LocalDateTime.now());
            
            Long count = videoRepository.countByTopicId(topicId);
            video.setOrderIndex(count.intValue() + 1);
            
            Video savedVideo = videoRepository.save(video);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedVideo);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error uploading video: " + e.getMessage());
        }
    }

    /**
     * POST /api/videos/{id}/upload-thumbnail
     * Upload thumbnail for existing video
     */
    @PostMapping("/{id}/upload-thumbnail")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> uploadThumbnail(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        try {
            Optional<Video> videoOptional = videoRepository.findById(id);
            if (!videoOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // Upload thumbnail
            String thumbnailUrl = cloudStorageService.uploadFile(file, "thumbnails");
            
            Video video = videoOptional.get();
            video.setThumbnailUrl(thumbnailUrl);
            video.setUpdatedAt(LocalDateTime.now());
            
            Video updatedVideo = videoRepository.save(video);
            return ResponseEntity.ok(updatedVideo);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error uploading thumbnail: " + e.getMessage());
        }
    }

    /**
     * GET /api/videos/all
     * Get all videos
     */
    @GetMapping("/all")
    public ResponseEntity<List<Video>> getAllVideos() {
        try {
            List<Video> videos = videoRepository.findAll();
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/videos/{id}
     * Get video by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getVideoById(@PathVariable String id) {
        try {
            Optional<Video> video = videoRepository.findById(id);
            if (video.isPresent()) {
                return ResponseEntity.ok(video.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching video: " + e.getMessage());
        }
    }

    /**
     * GET /api/videos/topic/{topicId}
     * Get all videos for a topic
     */
    @GetMapping("/topic/{topicId}")
    public ResponseEntity<List<Video>> getVideosByTopic(@PathVariable String topicId) {
        try {
            List<Video> videos = videoRepository.findByTopicIdOrderByOrderIndexAsc(topicId);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/videos/topic/{topicId}/difficulty/{level}
     * Get videos by topic and difficulty
     */
    @GetMapping("/topic/{topicId}/difficulty/{level}")
    public ResponseEntity<List<Video>> getVideosByTopicAndDifficulty(
            @PathVariable String topicId,
            @PathVariable String level) {
        try {
            List<Video> videos = videoRepository.findByTopicIdAndDifficultyOrderByOrderIndexAsc(
                topicId, level.toUpperCase());
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/videos/subject/{subjectId}
     * Get all videos for a subject
     */
    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<Video>> getVideosBySubject(@PathVariable String subjectId) {
        try {
            List<Video> videos = videoRepository.findBySubjectId(subjectId);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/videos/subject/{subjectId}/difficulty/{level}
     * Get videos by subject and difficulty
     */
    @GetMapping("/subject/{subjectId}/difficulty/{level}")
    public ResponseEntity<List<Video>> getVideosBySubjectAndDifficulty(
            @PathVariable String subjectId,
            @PathVariable String level) {
        try {
            List<Video> videos = videoRepository.findBySubjectIdAndDifficulty(
                subjectId, level.toUpperCase());
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/videos/preview
     * Get all preview videos (free access)
     */
    @GetMapping("/preview")
    public ResponseEntity<List<Video>> getPreviewVideos() {
        try {
            List<Video> videos = videoRepository.findByIsPreview(true);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/videos/difficulty/{level}
     * Get videos by difficulty level
     */
    @GetMapping("/difficulty/{level}")
    public ResponseEntity<List<Video>> getVideosByDifficulty(@PathVariable String level) {
        try {
            List<Video> videos = videoRepository.findByDifficulty(level.toUpperCase());
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * PUT /api/videos/{id}
     * Update video
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> updateVideo(@PathVariable String id, @RequestBody Video videoDetails) {
        try {
            Optional<Video> videoOptional = videoRepository.findById(id);
            if (!videoOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Video video = videoOptional.get();
            
            // Update fields
            if (videoDetails.getTitle() != null) {
                video.setTitle(videoDetails.getTitle());
            }
            if (videoDetails.getDescription() != null) {
                video.setDescription(videoDetails.getDescription());
            }
            if (videoDetails.getUrl() != null) {
                video.setUrl(videoDetails.getUrl());
            }
            if (videoDetails.getThumbnailUrl() != null) {
                video.setThumbnailUrl(videoDetails.getThumbnailUrl());
            }
            if (videoDetails.getDuration() != null) {
                video.setDuration(videoDetails.getDuration());
            }
            if (videoDetails.getIsPreview() != null) {
                video.setIsPreview(videoDetails.getIsPreview());
            }
            if (videoDetails.getOrderIndex() != null) {
                video.setOrderIndex(videoDetails.getOrderIndex());
            }
            
            video.setUpdatedAt(LocalDateTime.now());
            
            Video updatedVideo = videoRepository.save(video);
            return ResponseEntity.ok(updatedVideo);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating video: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/videos/{id}/preview
     * Toggle preview status
     */
    @PatchMapping("/{id}/preview")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> togglePreview(
            @PathVariable String id,
            @RequestParam Boolean isPreview) {
        try {
            Optional<Video> videoOptional = videoRepository.findById(id);
            if (!videoOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Video video = videoOptional.get();
            video.setIsPreview(isPreview);
            video.setUpdatedAt(LocalDateTime.now());
            
            Video updatedVideo = videoRepository.save(video);
            return ResponseEntity.ok(updatedVideo);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating preview status: " + e.getMessage());
        }
    }

    /**
     * DELETE /api/videos/{id}
     * Delete video
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR') or hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteVideo(@PathVariable String id) {
        try {
            Optional<Video> video = videoRepository.findById(id);
            if (!video.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            videoRepository.deleteById(id);
            return ResponseEntity.ok("Video deleted successfully");
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting video: " + e.getMessage());
        }
    }

    /**
     * GET /api/videos/topic/{topicId}/stats
     * Get video statistics for a topic
     */
    @GetMapping("/topic/{topicId}/stats")
    public ResponseEntity<?> getTopicVideoStats(@PathVariable String topicId) {
        try {
            Long totalVideos = videoRepository.countByTopicId(topicId);
            Long previewVideos = videoRepository.countByTopicIdAndIsPreview(topicId, true);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalVideos", totalVideos);
            stats.put("previewVideos", previewVideos);
            stats.put("lockedVideos", totalVideos - previewVideos);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching stats: " + e.getMessage());
        }
    }
}
