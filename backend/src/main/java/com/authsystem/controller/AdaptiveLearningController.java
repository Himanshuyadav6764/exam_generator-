package com.authsystem.controller;

import com.authsystem.model.DifficultyLevel;
import com.authsystem.model.StudentPerformance;
import com.authsystem.service.AdaptiveLearningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Adaptive Learning Controller
 * Handles all adaptive learning endpoints
 */
@RestController
@RequestMapping("/api/adaptive")
@CrossOrigin(origins = "*")
public class AdaptiveLearningController {
    
    @Autowired
    private AdaptiveLearningService adaptiveService;
    
    /**
     * Record quiz attempt and get updated adaptive profile
     */
    @PostMapping("/quiz-attempt")
    public ResponseEntity<?> recordQuizAttempt(@RequestBody Map<String, Object> request) {
        try {
            String studentEmail = (String) request.get("studentEmail");
            String courseId = (String) request.get("courseId");
            String topicName = (String) request.get("topicName");
            int score = (Integer) request.get("score");
            int totalQuestions = (Integer) request.get("totalQuestions");
            String difficultyStr = (String) request.getOrDefault("difficulty", "BEGINNER");
            long timeSpent = ((Number) request.getOrDefault("timeSpent", 0)).longValue();
            String quizId = (String) request.get("quizId"); // null for normal MCQ, "AI_QUIZ" for AI-generated
            
            DifficultyLevel difficulty = DifficultyLevel.fromString(difficultyStr);
            
            StudentPerformance performance = adaptiveService.recordQuizAttempt(
                studentEmail, courseId, topicName, score, totalQuestions, difficulty, timeSpent, quizId
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Quiz attempt recorded successfully",
                "performance", performance,
                "currentDifficulty", performance.getCurrentDifficultyLevel(),
                "recommendation", Map.of(
                    "topic", performance.getRecommendedTopic() != null ? performance.getRecommendedTopic() : "",
                    "difficulty", performance.getRecommendedDifficulty() != null ? performance.getRecommendedDifficulty() : DifficultyLevel.BEGINNER,
                    "reason", performance.getRecommendationReason() != null ? performance.getRecommendationReason() : ""
                )
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to record quiz attempt: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Update completion percentage for a topic
     */
    @PostMapping("/completion")
    public ResponseEntity<?> updateCompletion(@RequestBody Map<String, Object> request) {
        try {
            String studentEmail = (String) request.get("studentEmail");
            String courseId = (String) request.get("courseId");
            String topicName = (String) request.get("topicName");
            double percentage = ((Number) request.get("percentage")).doubleValue();
            
            StudentPerformance performance = adaptiveService.updateCompletionPercentage(
                studentEmail, courseId, topicName, percentage
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Completion updated successfully",
                "performance", performance
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to update completion: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get student performance for a course
     */
    @GetMapping("/performance")
    public ResponseEntity<?> getPerformance(
            @RequestParam String studentEmail,
            @RequestParam String courseId) {
        try {
            Optional<StudentPerformance> performance = adaptiveService.getPerformance(studentEmail, courseId);
            
            if (performance.isPresent()) {
                StudentPerformance perf = performance.get();
                
                // Get all quiz attempts
                List<StudentPerformance.QuizAttempt> allAttempts = perf.getQuizAttempts();
                
                // Separate AI quiz and MCQ attempts
                long aiQuizCount = allAttempts.stream()
                    .filter(a -> "AI_QUIZ".equals(a.getQuizId()) || a.getTopicName().contains("AI Quiz"))
                    .count();
                
                long mcqCount = allAttempts.stream()
                    .filter(a -> !"AI_QUIZ".equals(a.getQuizId()) && !a.getTopicName().contains("AI Quiz"))
                    .count();
                
                // Calculate AI quiz average
                double aiQuizAvg = allAttempts.stream()
                    .filter(a -> "AI_QUIZ".equals(a.getQuizId()) || a.getTopicName().contains("AI Quiz"))
                    .mapToDouble(StudentPerformance.QuizAttempt::getPercentage)
                    .average()
                    .orElse(0.0);
                
                // Calculate MCQ average
                double mcqAvg = allAttempts.stream()
                    .filter(a -> !"AI_QUIZ".equals(a.getQuizId()) && !a.getTopicName().contains("AI Quiz"))
                    .mapToDouble(StudentPerformance.QuizAttempt::getPercentage)
                    .average()
                    .orElse(0.0);
                
                // Calculate overall average from topic scores
                double overallScore = perf.getTopicScores().values().stream()
                    .mapToInt(Integer::intValue)
                    .average()
                    .orElse(0.0);
                
                // Calculate total time spent (seconds)
                long totalTimeSeconds = perf.getTimeSpentPerTopic().values().stream()
                    .mapToLong(Long::longValue)
                    .sum();
                
                // Calculate completion percentage
                double avgCompletion = perf.getCompletionPercentage().values().stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);
                
                // Build enhanced response
                Map<String, Object> enhancedPerf = new HashMap<>();
                enhancedPerf.put("id", perf.getId());
                enhancedPerf.put("studentEmail", perf.getStudentEmail());
                enhancedPerf.put("courseId", perf.getCourseId());
                enhancedPerf.put("quizAttempts", allAttempts);
                enhancedPerf.put("totalAttempts", allAttempts.size());
                enhancedPerf.put("aiQuizAttempts", aiQuizCount);
                enhancedPerf.put("mcqAttempts", mcqCount);
                enhancedPerf.put("aiQuizAverage", Math.round(aiQuizAvg * 100.0) / 100.0);
                enhancedPerf.put("mcqAverage", Math.round(mcqAvg * 100.0) / 100.0);
                enhancedPerf.put("topicScores", perf.getTopicScores());
                enhancedPerf.put("completionPercentage", perf.getCompletionPercentage());
                enhancedPerf.put("avgCompletion", Math.round(avgCompletion * 100.0) / 100.0);
                enhancedPerf.put("currentDifficultyLevel", perf.getCurrentDifficultyLevel().toString());
                enhancedPerf.put("overallScore", Math.round(overallScore * 100.0) / 100.0);
                enhancedPerf.put("totalTimeSpent", totalTimeSeconds);
                enhancedPerf.put("recommendedTopic", perf.getRecommendedTopic());
                enhancedPerf.put("recommendedDifficulty", perf.getRecommendedDifficulty());
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "performance", enhancedPerf
                ));
            } else {
                // Return empty performance structure
                Map<String, Object> emptyPerf = new HashMap<>();
                emptyPerf.put("studentEmail", studentEmail);
                emptyPerf.put("courseId", courseId);
                emptyPerf.put("quizAttempts", new ArrayList<>());
                emptyPerf.put("totalAttempts", 0);
                emptyPerf.put("aiQuizAttempts", 0);
                emptyPerf.put("mcqAttempts", 0);
                emptyPerf.put("aiQuizAverage", 0.0);
                emptyPerf.put("mcqAverage", 0.0);
                emptyPerf.put("topicScores", new HashMap<>());
                emptyPerf.put("completionPercentage", new HashMap<>());
                emptyPerf.put("avgCompletion", 0.0);
                emptyPerf.put("currentDifficultyLevel", "BEGINNER");
                emptyPerf.put("overallScore", 0.0);
                emptyPerf.put("totalTimeSpent", 0L);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "performance", emptyPerf,
                    "message", "No performance data yet"
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get performance: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get all performance records for a student
     */
    @GetMapping("/performance/student/{email}")
    public ResponseEntity<?> getStudentPerformance(@PathVariable String email) {
        try {
            List<StudentPerformance> performances = adaptiveService.getStudentPerformance(email);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "performances", performances,
                "count", performances.size()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to get student performance: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get overall progress and analytics
     */
    @GetMapping("/progress")
    public ResponseEntity<?> getOverallProgress(
            @RequestParam String studentEmail,
            @RequestParam String courseId) {
        try {
            Map<String, Object> progress = adaptiveService.calculateOverallProgress(studentEmail, courseId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "progress", progress
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to calculate progress: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Get overall progress across all courses for a student
     */
    @GetMapping("/overall-progress")
    public ResponseEntity<?> getOverallProgressAllCourses(@RequestParam String studentEmail) {
        try {
            System.out.println("🎯 GET /overall-progress called for: " + studentEmail);
            Map<String, Object> overallProgress = adaptiveService.calculateOverallProgressAllCourses(studentEmail);
            System.out.println("✅ Overall progress calculated successfully");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", overallProgress
            ));
            
        } catch (Exception e) {
            System.out.println("❌ Error calculating overall progress: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to calculate overall progress: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Reset performance for a course (admin/testing)
     */
    @DeleteMapping("/reset")
    public ResponseEntity<?> resetPerformance(
            @RequestParam String studentEmail,
            @RequestParam String courseId) {
        try {
            adaptiveService.resetPerformance(studentEmail, courseId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Performance reset successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to reset performance: " + e.getMessage()
            ));
        }
    }
}
