package com.authsystem.controller;

import com.authsystem.model.MCQ;
import com.authsystem.model.Topic;
import com.authsystem.repository.MCQRepository;
import com.authsystem.repository.TopicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * MCQController - Handles Multiple Choice Questions CRUD operations
 * MCQs belong to topics for testing knowledge
 */
@RestController
@RequestMapping("/api/mcqs")
@CrossOrigin(origins = "*")
public class MCQController {

    @Autowired
    private MCQRepository mcqRepository;
    
    @Autowired
    private TopicRepository topicRepository;

    /**
     * DELETE /api/mcqs/all
     * Delete ALL MCQs (for cleanup/testing)
     */
    @DeleteMapping("/all")
    // @PreAuthorize("hasAuthority('INSTRUCTOR')") // Temporarily disabled for cleanup
    public ResponseEntity<?> deleteAllMCQs() {
        try {
            System.out.println("🗑️ Deleting all MCQs...");
            mcqRepository.deleteAll();
            System.out.println("✅ All MCQs deleted successfully");
            return ResponseEntity.ok().body("All MCQs deleted successfully");
        } catch (Exception e) {
            System.err.println("❌ Error deleting all MCQs: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting MCQs: " + e.getMessage());
        }
    }

    /**
     * GET /api/mcqs/health
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("MCQ Controller is working!");
    }

    /**
     * POST /api/mcqs/create
     * Create a new MCQ
     */
    @PostMapping("/create")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createMCQ(@RequestBody MCQ mcq) {
        try {
            System.out.println("📝 Creating MCQ - CourseId: " + mcq.getCourseId() + ", TopicId: " + mcq.getTopicId() + ", Question: " + mcq.getQuestion());
            
            // Validate courseId first (CRITICAL)
            if (mcq.getCourseId() == null || mcq.getCourseId().isEmpty()) {
                System.out.println("❌ MCQ creation failed: courseId is missing");
                return ResponseEntity.badRequest().body("Course ID is required");
            }
            
            // Validate required fields
            if (mcq.getTopicId() == null || mcq.getTopicId().isEmpty()) {
                return ResponseEntity.badRequest().body("Topic ID is required");
            }
            if (mcq.getQuestion() == null || mcq.getQuestion().isEmpty()) {
                return ResponseEntity.badRequest().body("Question is required");
            }
            if (mcq.getOptions() == null || mcq.getOptions().size() < 2) {
                return ResponseEntity.badRequest().body("At least 2 options are required");
            }
            if (mcq.getCorrectAnswerIndex() == null) {
                return ResponseEntity.badRequest().body("Correct answer index is required");
            }
            if (mcq.getCorrectAnswerIndex() < 0 || mcq.getCorrectAnswerIndex() >= mcq.getOptions().size()) {
                return ResponseEntity.badRequest().body("Invalid correct answer index");
            }
            
            // Try to get topic details if topicId is provided
            Optional<Topic> topicOptional = topicRepository.findById(mcq.getTopicId());
            if (topicOptional.isPresent()) {
                Topic topic = topicOptional.get();
                
                // Set subjectId and topicName from topic if not already set
                if (mcq.getSubjectId() == null) {
                    mcq.setSubjectId(topic.getSubjectId());
                }
                if (mcq.getTopicName() == null || mcq.getTopicName().isEmpty()) {
                    mcq.setTopicName(topic.getName());
                }
                
                // If difficulty not provided, inherit from topic
                if (mcq.getDifficulty() == null || mcq.getDifficulty().isEmpty()) {
                    mcq.setDifficulty(topic.getDifficulty());
                }
            } else {
                // Topic not found in database, but allow creation with provided values
                // This supports creating MCQs for course topics that might not be in Topic collection
                if (mcq.getDifficulty() == null || mcq.getDifficulty().isEmpty()) {
                    mcq.setDifficulty("BEGINNER"); // Default difficulty
                }
            }
            
            // Set timestamps
            mcq.setCreatedAt(LocalDateTime.now());
            mcq.setUpdatedAt(LocalDateTime.now());
            
            // Set default points if not provided
            if (mcq.getPoints() == null) {
                mcq.setPoints(10);
            }
            
            MCQ savedMCQ = mcqRepository.save(mcq);
            System.out.println("✅ MCQ saved successfully - ID: " + savedMCQ.getId() + ", CourseId: " + savedMCQ.getCourseId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMCQ);
            
        } catch (Exception e) {
            e.printStackTrace(); // Log the full error
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating MCQ: " + e.getMessage());
        }
    }

    /**
     * POST /api/mcqs/bulk-create
     * Create multiple MCQs at once
     */
    @PostMapping("/bulk-create")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createBulkMCQs(@RequestBody Map<String, Object> request) {
        try {
            String topicId = (String) request.get("topicId");
            List<Map<String, Object>> mcqDataList = (List<Map<String, Object>>) request.get("mcqs");
            
            if (topicId == null || mcqDataList == null || mcqDataList.isEmpty()) {
                return ResponseEntity.badRequest().body("Topic ID and MCQ data are required");
            }
            
            // Verify topic exists
            Optional<Topic> topicOptional = topicRepository.findById(topicId);
            if (!topicOptional.isPresent()) {
                return ResponseEntity.badRequest().body("Topic not found");
            }
            
            Topic topic = topicOptional.get();
            List<MCQ> createdMCQs = new ArrayList<>();
            
            for (Map<String, Object> mcqData : mcqDataList) {
                MCQ mcq = new MCQ();
                mcq.setTopicId(topicId);
                mcq.setSubjectId(topic.getSubjectId());
                mcq.setTopicName(topic.getName());
                mcq.setDifficulty(topic.getDifficulty());
                
                mcq.setQuestion((String) mcqData.get("question"));
                mcq.setOptions((List<String>) mcqData.get("options"));
                mcq.setCorrectAnswerIndex((Integer) mcqData.get("correctAnswerIndex"));
                mcq.setExplanation((String) mcqData.get("explanation"));
                
                Integer points = (Integer) mcqData.get("points");
                mcq.setPoints(points != null ? points : 10);
                
                mcq.setCreatedAt(LocalDateTime.now());
                mcq.setUpdatedAt(LocalDateTime.now());
                
                MCQ savedMCQ = mcqRepository.save(mcq);
                createdMCQs.add(savedMCQ);
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdMCQs);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating MCQs: " + e.getMessage());
        }
    }

    /**
     * GET /api/mcqs/all
     * Get all MCQs
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllMCQs() {
        try {
            System.out.println("GET /api/mcqs/all called");
            
            // Check if repository is null
            if (mcqRepository == null) {
                System.err.println("ERROR: MCQRepository is null!");
                return ResponseEntity.ok(new ArrayList<MCQ>());
            }
            
            System.out.println("Calling mcqRepository.findAll()...");
            List<MCQ> mcqs = mcqRepository.findAll();
            System.out.println("Found " + (mcqs != null ? mcqs.size() : "null") + " MCQs");
            
            if (mcqs == null) {
                System.out.println("MCQ list was null, returning empty list");
                return ResponseEntity.ok(new ArrayList<MCQ>());
            }
            
            return ResponseEntity.ok(mcqs);
        } catch (Exception e) {
            System.err.println("EXCEPTION in getAllMCQs: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            // Return empty list instead of error to prevent frontend crashes
            return ResponseEntity.ok(new ArrayList<MCQ>());
        }
    }

    /**
     * GET /api/mcqs/{id}
     * Get MCQ by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getMCQById(@PathVariable String id) {
        try {
            Optional<MCQ> mcq = mcqRepository.findById(id);
            if (mcq.isPresent()) {
                return ResponseEntity.ok(mcq.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching MCQ: " + e.getMessage());
        }
    }

    /**
     * GET /api/mcqs/topic/{topicId}
     * Get all MCQs for a topic
     */
    @GetMapping("/topic/{topicId}")
    public ResponseEntity<List<MCQ>> getMCQsByTopic(@PathVariable String topicId) {
        try {
            List<MCQ> mcqs = mcqRepository.findByTopicId(topicId);
            return ResponseEntity.ok(mcqs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/mcqs/topic/{topicId}/difficulty/{level}
     * Get MCQs by topic and difficulty
     */
    @GetMapping("/topic/{topicId}/difficulty/{level}")
    public ResponseEntity<List<MCQ>> getMCQsByTopicAndDifficulty(
            @PathVariable String topicId,
            @PathVariable String level) {
        try {
            List<MCQ> mcqs = mcqRepository.findByTopicIdAndDifficulty(
                topicId, level.toUpperCase());
            return ResponseEntity.ok(mcqs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/mcqs/subject/{subjectId}
     * Get all MCQs for a subject
     */
    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<MCQ>> getMCQsBySubject(@PathVariable String subjectId) {
        try {
            List<MCQ> mcqs = mcqRepository.findBySubjectId(subjectId);
            return ResponseEntity.ok(mcqs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/mcqs/subject/{subjectId}/difficulty/{level}
     * Get MCQs by subject and difficulty
     */
    @GetMapping("/subject/{subjectId}/difficulty/{level}")
    public ResponseEntity<List<MCQ>> getMCQsBySubjectAndDifficulty(
            @PathVariable String subjectId,
            @PathVariable String level) {
        try {
            List<MCQ> mcqs = mcqRepository.findBySubjectIdAndDifficulty(
                subjectId, level.toUpperCase());
            return ResponseEntity.ok(mcqs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/mcqs/difficulty/{level}
     * Get MCQs by difficulty level
     */
    @GetMapping("/difficulty/{level}")
    public ResponseEntity<List<MCQ>> getMCQsByDifficulty(@PathVariable String level) {
        try {
            List<MCQ> mcqs = mcqRepository.findByDifficulty(level.toUpperCase());
            return ResponseEntity.ok(mcqs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * PUT /api/mcqs/{id}
     * Update MCQ
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> updateMCQ(@PathVariable String id, @RequestBody MCQ mcqDetails) {
        try {
            Optional<MCQ> mcqOptional = mcqRepository.findById(id);
            if (!mcqOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            MCQ mcq = mcqOptional.get();
            
            // Update fields
            if (mcqDetails.getQuestion() != null) {
                mcq.setQuestion(mcqDetails.getQuestion());
            }
            if (mcqDetails.getOptions() != null) {
                mcq.setOptions(mcqDetails.getOptions());
            }
            if (mcqDetails.getCorrectAnswerIndex() != null) {
                // Validate index
                if (mcqDetails.getCorrectAnswerIndex() >= 0 && 
                    mcqDetails.getCorrectAnswerIndex() < mcq.getOptions().size()) {
                    mcq.setCorrectAnswerIndex(mcqDetails.getCorrectAnswerIndex());
                } else {
                    return ResponseEntity.badRequest().body("Invalid correct answer index");
                }
            }
            if (mcqDetails.getExplanation() != null) {
                mcq.setExplanation(mcqDetails.getExplanation());
            }
            if (mcqDetails.getPoints() != null) {
                mcq.setPoints(mcqDetails.getPoints());
            }
            
            mcq.setUpdatedAt(LocalDateTime.now());
            
            MCQ updatedMCQ = mcqRepository.save(mcq);
            return ResponseEntity.ok(updatedMCQ);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating MCQ: " + e.getMessage());
        }
    }

    /**
     * DELETE /api/mcqs/{id}
     * Delete MCQ
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR') or hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteMCQ(@PathVariable String id) {
        try {
            Optional<MCQ> mcq = mcqRepository.findById(id);
            if (!mcq.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            mcqRepository.deleteById(id);
            return ResponseEntity.ok("MCQ deleted successfully");
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting MCQ: " + e.getMessage());
        }
    }

    /**
     * GET /api/mcqs/topic/{topicId}/stats
     * Get MCQ statistics for a topic
     */
    @GetMapping("/topic/{topicId}/stats")
    public ResponseEntity<?> getTopicMCQStats(@PathVariable String topicId) {
        try {
            Long totalMCQs = mcqRepository.countByTopicId(topicId);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalMCQs", totalMCQs);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching stats: " + e.getMessage());
        }
    }

    /**
     * GET /api/mcqs/course/{courseId}
     * Get all MCQs for a specific course
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getMCQsByCourse(@PathVariable String courseId) {
        try {
            System.out.println("📥 GET request for MCQs - courseId: " + courseId);
            List<MCQ> mcqs = mcqRepository.findByCourseId(courseId);
            System.out.println("✅ Found " + mcqs.size() + " MCQs for courseId: " + courseId);
            
            // Log details of each MCQ
            for (MCQ mcq : mcqs) {
                System.out.println("   - MCQ ID: " + mcq.getId() + ", TopicName: '" + mcq.getTopicName() + "', Question: " + 
                    (mcq.getQuestion() != null && mcq.getQuestion().length() > 30 ? mcq.getQuestion().substring(0, 30) + "..." : mcq.getQuestion()));
            }
            
            return ResponseEntity.ok(mcqs);
        } catch (Exception e) {
            System.err.println("❌ Error getting MCQs for courseId " + courseId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting MCQs: " + e.getMessage());
        }
    }

    /**
     * POST /api/mcqs/{id}/validate-answer
     * Validate student's answer
     */
    @PostMapping("/{id}/validate-answer")
    public ResponseEntity<?> validateAnswer(
            @PathVariable String id,
            @RequestParam Integer selectedIndex) {
        try {
            Optional<MCQ> mcqOptional = mcqRepository.findById(id);
            if (!mcqOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            MCQ mcq = mcqOptional.get();
            
            boolean isCorrect = mcq.getCorrectAnswerIndex().equals(selectedIndex);
            
            Map<String, Object> result = new HashMap<>();
            result.put("isCorrect", isCorrect);
            result.put("correctAnswerIndex", mcq.getCorrectAnswerIndex());
            result.put("points", isCorrect ? mcq.getPoints() : 0);
            
            if (mcq.getExplanation() != null) {
                result.put("explanation", mcq.getExplanation());
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error validating answer: " + e.getMessage());
        }
    }
}
