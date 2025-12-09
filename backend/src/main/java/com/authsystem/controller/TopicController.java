package com.authsystem.controller;

import com.authsystem.model.Topic;
import com.authsystem.model.Subject;
import com.authsystem.repository.TopicRepository;
import com.authsystem.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * TopicController - Handles Topic CRUD operations
 * Topics belong to subjects and must have matching difficulty levels
 */
@RestController
@RequestMapping("/api/topics")
@CrossOrigin(origins = "*")
public class TopicController {

    @Autowired
    private TopicRepository topicRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;

    /**
     * POST /api/topics/create
     * Create a new topic under a subject
     */
    @PostMapping("/create")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createTopic(@RequestBody Topic topic) {
        try {
            // Validate required fields
            if (topic.getSubjectId() == null || topic.getSubjectId().isEmpty()) {
                return ResponseEntity.badRequest().body("Subject ID is required");
            }
            
            if (topic.getName() == null || topic.getName().isEmpty()) {
                return ResponseEntity.badRequest().body("Topic name is required");
            }
            
            // Verify subject exists
            Optional<Subject> subjectOptional = subjectRepository.findById(topic.getSubjectId());
            if (!subjectOptional.isPresent()) {
                return ResponseEntity.badRequest().body("Subject not found");
            }
            
            Subject subject = subjectOptional.get();
            
            // If difficulty not provided, inherit from subject
            if (topic.getDifficulty() == null || topic.getDifficulty().isEmpty()) {
                topic.setDifficulty(subject.getDifficulty());
            } else {
                // Validate difficulty matches subject
                if (!topic.getDifficulty().equals(subject.getDifficulty())) {
                    return ResponseEntity.badRequest()
                        .body("Topic difficulty must match subject difficulty: " + subject.getDifficulty());
                }
            }
            
            // Set timestamps
            topic.setCreatedAt(LocalDateTime.now());
            topic.setUpdatedAt(LocalDateTime.now());
            
            // Set default values
            if (topic.getActive() == null) {
                topic.setActive(true);
            }
            if (topic.getOrderIndex() == null) {
                // Auto-increment order index
                Long count = topicRepository.countBySubjectId(topic.getSubjectId());
                topic.setOrderIndex(count.intValue() + 1);
            }
            
            // Save topic
            Topic savedTopic = topicRepository.save(topic);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTopic);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating topic: " + e.getMessage());
        }
    }

    /**
     * POST /api/topics/bulk-create
     * Create multiple topics at once
     */
    @PostMapping("/bulk-create")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createBulkTopics(@RequestBody Map<String, Object> request) {
        try {
            String subjectId = (String) request.get("subjectId");
            List<String> topicNames = (List<String>) request.get("topicNames");
            
            if (subjectId == null || topicNames == null || topicNames.isEmpty()) {
                return ResponseEntity.badRequest().body("Subject ID and topic names are required");
            }
            
            // Verify subject exists
            Optional<Subject> subjectOptional = subjectRepository.findById(subjectId);
            if (!subjectOptional.isPresent()) {
                return ResponseEntity.badRequest().body("Subject not found");
            }
            
            Subject subject = subjectOptional.get();
            List<Topic> createdTopics = new ArrayList<>();
            
            int orderIndex = topicRepository.countBySubjectId(subjectId).intValue() + 1;
            
            for (String name : topicNames) {
                Topic topic = new Topic();
                topic.setSubjectId(subjectId);
                topic.setName(name);
                topic.setDifficulty(subject.getDifficulty());
                topic.setActive(true);
                topic.setOrderIndex(orderIndex++);
                topic.setCreatedAt(LocalDateTime.now());
                topic.setUpdatedAt(LocalDateTime.now());
                
                Topic savedTopic = topicRepository.save(topic);
                createdTopics.add(savedTopic);
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdTopics);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating topics: " + e.getMessage());
        }
    }

    /**
     * GET /api/topics/all
     * Get all topics
     */
    @GetMapping("/all")
    public ResponseEntity<List<Topic>> getAllTopics() {
        try {
            List<Topic> topics = topicRepository.findAll();
            return ResponseEntity.ok(topics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/topics/{id}
     * Get topic by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTopicById(@PathVariable String id) {
        try {
            Optional<Topic> topic = topicRepository.findById(id);
            if (topic.isPresent()) {
                return ResponseEntity.ok(topic.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching topic: " + e.getMessage());
        }
    }

    /**
     * GET /api/topics/subject/{subjectId}
     * Get all topics for a subject
     */
    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<Topic>> getTopicsBySubject(@PathVariable String subjectId) {
        try {
            List<Topic> topics = topicRepository.findBySubjectIdOrderByOrderIndexAsc(subjectId);
            return ResponseEntity.ok(topics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/topics/subject/{subjectId}/difficulty/{level}
     * Get topics by subject and difficulty (for GFG-style filtering)
     */
    @GetMapping("/subject/{subjectId}/difficulty/{level}")
    public ResponseEntity<List<Topic>> getTopicsBySubjectAndDifficulty(
            @PathVariable String subjectId,
            @PathVariable String level) {
        try {
            List<Topic> topics = topicRepository.findBySubjectIdAndDifficultyOrderByOrderIndexAsc(
                subjectId, level.toUpperCase());
            return ResponseEntity.ok(topics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/topics/difficulty/{level}
     * Get all topics by difficulty level
     */
    @GetMapping("/difficulty/{level}")
    public ResponseEntity<List<Topic>> getTopicsByDifficulty(@PathVariable String level) {
        try {
            List<Topic> topics = topicRepository.findByDifficulty(level.toUpperCase());
            return ResponseEntity.ok(topics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * PUT /api/topics/{id}
     * Update topic
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> updateTopic(@PathVariable String id, @RequestBody Topic topicDetails) {
        try {
            Optional<Topic> topicOptional = topicRepository.findById(id);
            if (!topicOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Topic topic = topicOptional.get();
            
            // Update fields
            if (topicDetails.getName() != null) {
                topic.setName(topicDetails.getName());
            }
            if (topicDetails.getDescription() != null) {
                topic.setDescription(topicDetails.getDescription());
            }
            if (topicDetails.getOrderIndex() != null) {
                topic.setOrderIndex(topicDetails.getOrderIndex());
            }
            if (topicDetails.getEstimatedHours() != null) {
                topic.setEstimatedHours(topicDetails.getEstimatedHours());
            }
            if (topicDetails.getActive() != null) {
                topic.setActive(topicDetails.getActive());
            }
            
            // Don't allow changing difficulty or subjectId after creation
            // to maintain data integrity
            
            topic.setUpdatedAt(LocalDateTime.now());
            
            Topic updatedTopic = topicRepository.save(topic);
            return ResponseEntity.ok(updatedTopic);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating topic: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/topics/{id}/reorder
     * Update topic order index
     */
    @PatchMapping("/{id}/reorder")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> reorderTopic(
            @PathVariable String id,
            @RequestParam Integer newOrderIndex) {
        try {
            Optional<Topic> topicOptional = topicRepository.findById(id);
            if (!topicOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Topic topic = topicOptional.get();
            topic.setOrderIndex(newOrderIndex);
            topic.setUpdatedAt(LocalDateTime.now());
            
            Topic updatedTopic = topicRepository.save(topic);
            return ResponseEntity.ok(updatedTopic);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error reordering topic: " + e.getMessage());
        }
    }

    /**
     * DELETE /api/topics/{id}
     * Delete topic
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR') or hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteTopic(@PathVariable String id) {
        try {
            Optional<Topic> topic = topicRepository.findById(id);
            if (!topic.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // TODO: Also delete related videos, PDFs, MCQs (cascade delete)
            
            topicRepository.deleteById(id);
            
            return ResponseEntity.ok("Topic deleted successfully");
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting topic: " + e.getMessage());
        }
    }
}
