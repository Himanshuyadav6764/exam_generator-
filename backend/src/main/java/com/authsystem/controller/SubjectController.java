package com.authsystem.controller;

import com.authsystem.service.CloudStorageService;
import com.authsystem.model.Subject;
import com.authsystem.model.Topic;
import com.authsystem.repository.SubjectRepository;
import com.authsystem.repository.TopicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/**
 * SubjectController - Handles Subject (Course) CRUD operations
 * Subjects are the top-level courses like "Java Programming"
 */
@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "*")
public class SubjectController {

    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private TopicRepository topicRepository;
    
    @Autowired
    private CloudStorageService cloudStorageService;

    /**
     * POST /api/subjects/create
     * Create a new subject/course
     */
    @PostMapping("/create")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createSubject(@RequestBody Subject subject) {
        try {
            // Validate required fields
            if (subject.getTitle() == null || subject.getTitle().isEmpty()) {
                return ResponseEntity.badRequest().body("Subject title is required");
            }
            
            if (subject.getDifficulty() == null || subject.getDifficulty().isEmpty()) {
                return ResponseEntity.badRequest().body("Difficulty level is required");
            }
            
            // Check if subject with same title exists
            if (subjectRepository.existsByTitle(subject.getTitle())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Subject with this title already exists");
            }
            
            // Set timestamps
            subject.setCreatedAt(LocalDateTime.now());
            subject.setUpdatedAt(LocalDateTime.now());
            
            // Set default values
            if (subject.getStatus() == null) {
                subject.setStatus("DRAFT");
            }
            if (subject.getActive() == null) {
                subject.setActive(true);
            }
            
            // Save subject
            Subject savedSubject = subjectRepository.save(subject);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedSubject);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating subject: " + e.getMessage());
        }
    }

    /**
     * POST /api/subjects/create-with-thumbnail
     * Create subject with thumbnail upload
     */
    @PostMapping("/create-with-thumbnail")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createSubjectWithThumbnail(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("difficulty") String difficulty,
            @RequestParam("instructorEmail") String instructorEmail,
            @RequestParam(value = "instructorName", required = false) String instructorName,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "status", defaultValue = "DRAFT") String status,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        try {
            // Create subject
            Subject subject = new Subject();
            subject.setTitle(title);
            subject.setDescription(description);
            subject.setDifficulty(difficulty);
            subject.setInstructorEmail(instructorEmail);
            subject.setInstructorName(instructorName);
            subject.setCategory(category);
            subject.setStatus(status);
            subject.setActive(true);
            subject.setCreatedAt(LocalDateTime.now());
            subject.setUpdatedAt(LocalDateTime.now());
            
            // Upload thumbnail if provided
            if (thumbnail != null && !thumbnail.isEmpty()) {
                try {
                    String thumbnailUrl = cloudStorageService.uploadFile(thumbnail, "subject-thumbnails");
                    subject.setThumbnail(thumbnailUrl);
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error uploading thumbnail: " + e.getMessage());
                }
            }
            
            // Save subject
            Subject savedSubject = subjectRepository.save(subject);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedSubject);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating subject: " + e.getMessage());
        }
    }

    /**
     * GET /api/subjects/all
     * Get all subjects
     */
    @GetMapping("/all")
    public ResponseEntity<List<Subject>> getAllSubjects() {
        try {
            List<Subject> subjects = subjectRepository.findAll();
            return ResponseEntity.ok(subjects);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/subjects/{id}
     * Get subject by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getSubjectById(@PathVariable String id) {
        try {
            Optional<Subject> subject = subjectRepository.findById(id);
            if (subject.isPresent()) {
                return ResponseEntity.ok(subject.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching subject: " + e.getMessage());
        }
    }

    /**
     * GET /api/subjects/difficulty/{level}
     * Get subjects by difficulty level
     */
    @GetMapping("/difficulty/{level}")
    public ResponseEntity<List<Subject>> getSubjectsByDifficulty(@PathVariable String level) {
        try {
            List<Subject> subjects = subjectRepository.findByDifficulty(level.toUpperCase());
            return ResponseEntity.ok(subjects);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/subjects/instructor/{email}
     * Get subjects by instructor
     */
    @GetMapping("/instructor/{email}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<List<Subject>> getSubjectsByInstructor(@PathVariable String email) {
        try {
            List<Subject> subjects = subjectRepository.findByInstructorEmail(email);
            return ResponseEntity.ok(subjects);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/subjects/status/{status}
     * Get subjects by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Subject>> getSubjectsByStatus(@PathVariable String status) {
        try {
            List<Subject> subjects = subjectRepository.findByStatus(status.toUpperCase());
            return ResponseEntity.ok(subjects);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * PUT /api/subjects/{id}
     * Update subject
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> updateSubject(@PathVariable String id, @RequestBody Subject subjectDetails) {
        try {
            Optional<Subject> subjectOptional = subjectRepository.findById(id);
            if (!subjectOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Subject subject = subjectOptional.get();
            
            // Update fields
            if (subjectDetails.getTitle() != null) {
                subject.setTitle(subjectDetails.getTitle());
            }
            if (subjectDetails.getDescription() != null) {
                subject.setDescription(subjectDetails.getDescription());
            }
            if (subjectDetails.getDifficulty() != null) {
                subject.setDifficulty(subjectDetails.getDifficulty());
            }
            if (subjectDetails.getThumbnail() != null) {
                subject.setThumbnail(subjectDetails.getThumbnail());
            }
            if (subjectDetails.getStatus() != null) {
                subject.setStatus(subjectDetails.getStatus());
            }
            if (subjectDetails.getCategory() != null) {
                subject.setCategory(subjectDetails.getCategory());
            }
            if (subjectDetails.getActive() != null) {
                subject.setActive(subjectDetails.getActive());
            }
            
            subject.setUpdatedAt(LocalDateTime.now());
            
            Subject updatedSubject = subjectRepository.save(subject);
            return ResponseEntity.ok(updatedSubject);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating subject: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/subjects/{id}/publish
     * Publish subject (change status to PUBLISHED)
     */
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> publishSubject(@PathVariable String id) {
        try {
            Optional<Subject> subjectOptional = subjectRepository.findById(id);
            if (!subjectOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Subject subject = subjectOptional.get();
            subject.setStatus("PUBLISHED");
            subject.setUpdatedAt(LocalDateTime.now());
            
            Subject publishedSubject = subjectRepository.save(subject);
            return ResponseEntity.ok(publishedSubject);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error publishing subject: " + e.getMessage());
        }
    }

    /**
     * DELETE /api/subjects/{id}
     * Delete subject and cascade delete all related topics
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR') or hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteSubject(@PathVariable String id) {
        try {
            Optional<Subject> subject = subjectRepository.findById(id);
            if (!subject.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // Delete all topics for this subject (cascade)
            topicRepository.deleteBySubjectId(id);
            
            // Delete the subject
            subjectRepository.deleteById(id);
            
            return ResponseEntity.ok("Subject and related topics deleted successfully");
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting subject: " + e.getMessage());
        }
    }

    /**
     * GET /api/subjects/{id}/stats
     * Get subject statistics (topic count, etc.)
     */
    @GetMapping("/{id}/stats")
    public ResponseEntity<?> getSubjectStats(@PathVariable String id) {
        try {
            Optional<Subject> subjectOptional = subjectRepository.findById(id);
            if (!subjectOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Subject subject = subjectOptional.get();
            Long topicCount = topicRepository.countBySubjectId(id);
            Long topicCountByDifficulty = topicRepository.countBySubjectIdAndDifficulty(id, subject.getDifficulty());
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("subject", subject);
            stats.put("totalTopics", topicCount);
            stats.put("topicsMatchingDifficulty", topicCountByDifficulty);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching subject stats: " + e.getMessage());
        }
    }
}
