package com.authsystem.controller;

import com.authsystem.model.AIQuiz;
import com.authsystem.repository.AIQuizRepository;
import com.authsystem.service.OpenAIQuizService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ai-quiz")
@CrossOrigin(origins = {"http://localhost:4200", "*"})
public class AIQuizController {
    
    private static final Logger logger = LoggerFactory.getLogger(AIQuizController.class);
    
    @Autowired
    private OpenAIQuizService openAIQuizService;
    
    @Autowired
    private AIQuizRepository aiQuizRepository;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * Generate quiz using OpenAI GPT
     * POST /api/ai-quiz/generate
     */
    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<Map<String, Object>> generateQuiz(@RequestBody Map<String, Object> request) {
        try {
            String topic = (String) request.get("topic");
            Integer numberOfQuestions = (Integer) request.getOrDefault("numberOfQuestions", 10);
            String apiKey = (String) request.get("apiKey"); // Optional API key override
            
            logger.info("🎯 AI Quiz Generation Request - Topic: '{}', Questions: {}", topic, numberOfQuestions);
            
            // Validate input
            if (topic == null || topic.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Topic is required"));
            }
            
            if (numberOfQuestions < 3 || numberOfQuestions > 50) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Number of questions must be between 3 and 50"));
            }
            
            // Generate quiz using OpenAI
            String quizJson = openAIQuizService.generateQuiz(topic, numberOfQuestions, apiKey);
            
            // Validate structure
            if (!openAIQuizService.validateQuizStructure(quizJson)) {
                logger.warn("⚠️ Generated quiz has validation issues");
            }
            
            // Parse the JSON
            Map<String, Object> generatedQuiz = objectMapper.readValue(quizJson, Map.class);
            
            logger.info("✅ Quiz generated successfully with {} questions", 
                    ((List<?>) generatedQuiz.get("questions")).size());
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "quiz", generatedQuiz,
                    "generatedAt", new Date()
            ));
            
        } catch (IllegalArgumentException e) {
            logger.error("❌ Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage()));
                    
        } catch (Exception e) {
            logger.error("❌ Quiz generation failed", e);
            return ResponseEntity.status(500)
                    .body(Map.of(
                            "success", false,
                            "error", "Failed to generate quiz: " + e.getMessage()
                    ));
        }
    }
    
    /**
     * Save quiz to database after instructor review
     * POST /api/ai-quiz/save
     */
    @PostMapping("/save")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<Map<String, Object>> saveQuiz(
            @RequestBody AIQuiz aiQuiz,
            Authentication authentication) {
        try {
            logger.info("💾 Saving AI Quiz: {}", aiQuiz.getTitle());
            
            // Validate
            if (aiQuiz.getTitle() == null || aiQuiz.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Quiz title is required"));
            }
            
            if (aiQuiz.getQuestions() == null || aiQuiz.getQuestions().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Quiz must have at least one question"));
            }
            
            // Set metadata
            aiQuiz.setCreatedBy(authentication.getName());
            aiQuiz.setCreatedAt(new Date());
            aiQuiz.setUpdatedAt(new Date());
            aiQuiz.setTotalQuestions(aiQuiz.getQuestions().size());
            
            // Save to MongoDB
            AIQuiz savedQuiz = aiQuizRepository.save(aiQuiz);
            
            logger.info("✅ Quiz saved successfully - ID: {}", savedQuiz.getId());
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "quiz", savedQuiz,
                    "message", "Quiz saved successfully"
            ));
            
        } catch (Exception e) {
            logger.error("❌ Failed to save quiz", e);
            return ResponseEntity.status(500)
                    .body(Map.of(
                            "success", false,
                            "error", "Failed to save quiz: " + e.getMessage()
                    ));
        }
    }
    
    /**
     * Get all quizzes for a course
     * GET /api/ai-quiz/course/{courseId}
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<Map<String, Object>> getQuizzesByCourse(@PathVariable String courseId) {
        try {
            List<AIQuiz> quizzes = aiQuizRepository.findByCourseId(courseId);
            
            logger.info("📚 Retrieved {} quizzes for course: {}", quizzes.size(), courseId);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "quizzes", quizzes,
                    "total", quizzes.size()
            ));
            
        } catch (Exception e) {
            logger.error("❌ Failed to fetch quizzes", e);
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Get quiz by ID
     * GET /api/ai-quiz/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getQuizById(@PathVariable String id) {
        try {
            Optional<AIQuiz> quiz = aiQuizRepository.findById(id);
            
            if (quiz.isEmpty()) {
                return ResponseEntity.status(404)
                        .body(Map.of("success", false, "error", "Quiz not found"));
            }
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "quiz", quiz.get()
            ));
            
        } catch (Exception e) {
            logger.error("❌ Failed to fetch quiz", e);
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Update quiz
     * PUT /api/ai-quiz/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<Map<String, Object>> updateQuiz(
            @PathVariable String id,
            @RequestBody AIQuiz updatedQuiz) {
        try {
            Optional<AIQuiz> existingQuiz = aiQuizRepository.findById(id);
            
            if (existingQuiz.isEmpty()) {
                return ResponseEntity.status(404)
                        .body(Map.of("success", false, "error", "Quiz not found"));
            }
            
            AIQuiz quiz = existingQuiz.get();
            quiz.setTitle(updatedQuiz.getTitle());
            quiz.setDescription(updatedQuiz.getDescription());
            quiz.setQuestions(updatedQuiz.getQuestions());
            quiz.setDuration(updatedQuiz.getDuration());
            quiz.setPublished(updatedQuiz.isPublished());
            quiz.setUpdatedAt(new Date());
            quiz.setTotalQuestions(updatedQuiz.getQuestions().size());
            
            AIQuiz saved = aiQuizRepository.save(quiz);
            
            logger.info("✅ Quiz updated: {}", saved.getId());
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "quiz", saved,
                    "message", "Quiz updated successfully"
            ));
            
        } catch (Exception e) {
            logger.error("❌ Failed to update quiz", e);
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Delete quiz
     * DELETE /api/ai-quiz/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<Map<String, Object>> deleteQuiz(@PathVariable String id) {
        try {
            if (!aiQuizRepository.existsById(id)) {
                return ResponseEntity.status(404)
                        .body(Map.of("success", false, "error", "Quiz not found"));
            }
            
            aiQuizRepository.deleteById(id);
            
            logger.info("✅ Quiz deleted: {}", id);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Quiz deleted successfully"
            ));
            
        } catch (Exception e) {
            logger.error("❌ Failed to delete quiz", e);
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Get instructor's quizzes
     * GET /api/ai-quiz/my-quizzes
     */
    @GetMapping("/my-quizzes")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<Map<String, Object>> getMyQuizzes(Authentication authentication) {
        try {
            String instructorEmail = authentication.getName();
            List<AIQuiz> quizzes = aiQuizRepository.findByCreatedBy(instructorEmail);
            
            logger.info("📚 Retrieved {} quizzes for instructor: {}", quizzes.size(), instructorEmail);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "quizzes", quizzes,
                    "total", quizzes.size()
            ));
            
        } catch (Exception e) {
            logger.error("❌ Failed to fetch instructor quizzes", e);
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
