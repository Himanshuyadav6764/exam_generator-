package com.authsystem.service;

import com.authsystem.model.DifficultyLevel;
import com.authsystem.model.StudentPerformance;
import com.authsystem.model.StudentPerformance.QuizAttempt;
import com.authsystem.repository.StudentPerformanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Adaptive Learning Service
 * Implements the "brain" of the adaptive learning system
 */
@Service
public class AdaptiveLearningService {
    
    @Autowired
    private StudentPerformanceRepository performanceRepository;
    
    /**
     * Record a quiz attempt and update adaptive profile
     */
    public StudentPerformance recordQuizAttempt(String studentEmail, String courseId, 
                                                String topicName, int score, int totalQuestions,
                                                DifficultyLevel difficultyLevel, long timeSpent) {
        
        // Get or create performance record
        StudentPerformance performance = performanceRepository
            .findByStudentEmailAndCourseId(studentEmail, courseId)
            .orElse(new StudentPerformance(studentEmail, courseId));
        
        // Add quiz attempt
        QuizAttempt attempt = new QuizAttempt(
            UUID.randomUUID().toString(),
            topicName,
            score,
            totalQuestions,
            difficultyLevel,
            timeSpent
        );
        performance.getQuizAttempts().add(attempt);
        performance.setLastQuizDate(LocalDateTime.now());
        
        // Update topic scores (average)
        updateTopicScores(performance, topicName);
        
        // Update time spent
        Long currentTime = performance.getTimeSpentPerTopic().getOrDefault(topicName, 0L);
        performance.getTimeSpentPerTopic().put(topicName, currentTime + timeSpent);
        
        // Apply adaptive decision logic
        applyAdaptiveLogic(performance, attempt);
        
        // Generate next recommendation
        generateRecommendation(performance);
        
        performance.setUpdatedAt(LocalDateTime.now());
        
        return performanceRepository.save(performance);
    }
    
    /**
     * ADAPTIVE DECISION LOGIC - The Brain of the System
     * Score < 40% → Reduce difficulty
     * Score 40-80% → Maintain current difficulty
     * Score > 80% → Increase difficulty
     */
    private void applyAdaptiveLogic(StudentPerformance performance, QuizAttempt attempt) {
        double percentage = attempt.getPercentage();
        DifficultyLevel currentLevel = performance.getCurrentDifficultyLevel();
        DifficultyLevel newLevel = currentLevel;
        
        System.out.println("🧠 Adaptive Logic - Score: " + percentage + "%, Current Level: " + currentLevel);
        
        if (percentage < 40) {
            // Low score - reduce difficulty
            performance.setConsecutiveLowScores(performance.getConsecutiveLowScores() + 1);
            performance.setConsecutiveHighScores(0);
            
            if (performance.getConsecutiveLowScores() >= 2) {
                newLevel = currentLevel.getPrevious();
                System.out.println("⬇️ Reducing difficulty to: " + newLevel);
            }
            
        } else if (percentage > 80) {
            // High score - increase difficulty
            performance.setConsecutiveHighScores(performance.getConsecutiveHighScores() + 1);
            performance.setConsecutiveLowScores(0);
            
            if (performance.getConsecutiveHighScores() >= 2) {
                newLevel = currentLevel.getNext();
                System.out.println("⬆️ Increasing difficulty to: " + newLevel);
            }
            
        } else {
            // Medium score - maintain difficulty
            performance.setConsecutiveHighScores(0);
            performance.setConsecutiveLowScores(0);
            System.out.println("➡️ Maintaining difficulty at: " + currentLevel);
        }
        
        performance.setCurrentDifficultyLevel(newLevel);
        performance.getTopicDifficultyLevels().put(attempt.getTopicName(), newLevel);
    }
    
    /**
     * Generate Next Lesson Recommendation
     */
    private void generateRecommendation(StudentPerformance performance) {
        Map<String, Integer> topicScores = performance.getTopicScores();
        
        if (topicScores.isEmpty()) {
            return;
        }
        
        // Find weakest topic (lowest score)
        String weakestTopic = topicScores.entrySet().stream()
            .min(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(null);
        
        // Find strongest topic (highest score)
        String strongestTopic = topicScores.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(null);
        
        Integer weakestScore = weakestTopic != null ? topicScores.get(weakestTopic) : 0;
        Integer strongestScore = strongestTopic != null ? topicScores.get(strongestTopic) : 0;
        
        // Recommendation logic
        String recommendedTopic;
        DifficultyLevel recommendedDifficulty;
        String reason;
        
        if (weakestScore < 50) {
            // Focus on weak areas
            recommendedTopic = weakestTopic;
            recommendedDifficulty = DifficultyLevel.BEGINNER;
            reason = "Your score in " + weakestTopic + " (" + weakestScore + "%) needs improvement. Start with basics.";
            
        } else if (strongestScore > 80) {
            // Challenge with advanced content
            recommendedTopic = strongestTopic;
            recommendedDifficulty = DifficultyLevel.ADVANCED;
            reason = "You're excelling in " + strongestTopic + " (" + strongestScore + "%)! Ready for advanced topics.";
            
        } else {
            // Continue with current level
            recommendedTopic = performance.getTopicName() != null ? 
                               performance.getTopicName() : weakestTopic;
            recommendedDifficulty = performance.getCurrentDifficultyLevel();
            reason = "Continue practicing at your current level to build strong fundamentals.";
        }
        
        performance.setRecommendedTopic(recommendedTopic);
        performance.setRecommendedDifficulty(recommendedDifficulty);
        performance.setRecommendationReason(reason);
        
        System.out.println("💡 Recommendation: " + recommendedTopic + " (" + recommendedDifficulty + ")");
        System.out.println("📝 Reason: " + reason);
    }
    
    /**
     * Update topic scores (calculate average)
     */
    private void updateTopicScores(StudentPerformance performance, String topicName) {
        List<QuizAttempt> topicAttempts = performance.getQuizAttempts().stream()
            .filter(a -> a.getTopicName().equals(topicName))
            .collect(Collectors.toList());
        
        if (!topicAttempts.isEmpty()) {
            double avgScore = topicAttempts.stream()
                .mapToDouble(QuizAttempt::getPercentage)
                .average()
                .orElse(0.0);
            
            performance.getTopicScores().put(topicName, (int) avgScore);
        }
    }
    
    /**
     * Update completion percentage for a topic
     */
    public StudentPerformance updateCompletionPercentage(String studentEmail, String courseId, 
                                                         String topicName, double percentage) {
        StudentPerformance performance = performanceRepository
            .findByStudentEmailAndCourseId(studentEmail, courseId)
            .orElse(new StudentPerformance(studentEmail, courseId));
        
        performance.getCompletionPercentage().put(topicName, percentage);
        performance.setUpdatedAt(LocalDateTime.now());
        
        return performanceRepository.save(performance);
    }
    
    /**
     * Get student performance for a course
     */
    public Optional<StudentPerformance> getPerformance(String studentEmail, String courseId) {
        return performanceRepository.findByStudentEmailAndCourseId(studentEmail, courseId);
    }
    
    /**
     * Get all performance records for a student
     */
    public List<StudentPerformance> getStudentPerformance(String studentEmail) {
        return performanceRepository.findByStudentEmail(studentEmail);
    }
    
    /**
     * Calculate overall progress across all topics
     */
    public Map<String, Object> calculateOverallProgress(String studentEmail, String courseId) {
        Optional<StudentPerformance> perfOpt = performanceRepository
            .findByStudentEmailAndCourseId(studentEmail, courseId);
        
        if (!perfOpt.isPresent()) {
            return new HashMap<>();
        }
        
        StudentPerformance performance = perfOpt.get();
        Map<String, Object> progress = new HashMap<>();
        
        // Overall completion
        double avgCompletion = performance.getCompletionPercentage().values().stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
        
        // Overall score
        double avgScore = performance.getTopicScores().values().stream()
            .mapToInt(Integer::intValue)
            .average()
            .orElse(0.0);
        
        // Total time spent
        long totalTime = performance.getTimeSpentPerTopic().values().stream()
            .mapToLong(Long::longValue)
            .sum();
        
        // Strength and weakness analysis
        Map<String, String> strengthWeakness = new HashMap<>();
        performance.getTopicScores().forEach((topic, score) -> {
            if (score > 80) {
                strengthWeakness.put(topic, "STRONG");
            } else if (score < 50) {
                strengthWeakness.put(topic, "WEAK");
            } else {
                strengthWeakness.put(topic, "MODERATE");
            }
        });
        
        progress.put("overallCompletion", Math.round(avgCompletion * 100.0) / 100.0);
        progress.put("overallScore", Math.round(avgScore * 100.0) / 100.0);
        progress.put("totalTimeSpent", totalTime);
        progress.put("currentDifficultyLevel", performance.getCurrentDifficultyLevel());
        progress.put("topicScores", performance.getTopicScores());
        progress.put("topicCompletion", performance.getCompletionPercentage());
        progress.put("strengthWeakness", strengthWeakness);
        progress.put("recommendedTopic", performance.getRecommendedTopic());
        progress.put("recommendedDifficulty", performance.getRecommendedDifficulty());
        progress.put("recommendationReason", performance.getRecommendationReason());
        progress.put("totalQuizzes", performance.getQuizAttempts().size());
        
        return progress;
    }
    
    /**
     * Calculate overall progress across ALL courses for a student
     */
    public Map<String, Object> calculateOverallProgressAllCourses(String studentEmail) {
        Map<String, Object> overallData = new HashMap<>();
        
        // Get all performance records for student
        List<StudentPerformance> allPerformances = performanceRepository.findByStudentEmail(studentEmail);
        
        if (allPerformances.isEmpty()) {
            overallData.put("totalCourses", 0);
            overallData.put("totalQuizzes", 0);
            overallData.put("overallScore", 0.0);
            overallData.put("totalTimeSpent", 0L);
            overallData.put("courseProgress", new ArrayList<>());
            return overallData;
        }
        
        // Aggregate data across all courses
        int totalQuizzes = 0;
        long totalTime = 0;
        double totalScore = 0;
        List<Map<String, Object>> courseProgressList = new ArrayList<>();
        
        for (StudentPerformance perf : allPerformances) {
            totalQuizzes += perf.getQuizAttempts().size();
            totalTime += perf.getTimeSpentPerTopic().values().stream().mapToLong(Long::longValue).sum();
            
            // Calculate average score for this course
            if (!perf.getTopicScores().isEmpty()) {
                double courseScore = perf.getTopicScores().values().stream()
                    .mapToDouble(Integer::doubleValue)
                    .average()
                    .orElse(0.0);
                totalScore += courseScore;
                
                // Add course-specific progress
                Map<String, Object> courseData = new HashMap<>();
                courseData.put("courseId", perf.getCourseId());
                courseData.put("score", Math.round(courseScore * 100.0) / 100.0);
                courseData.put("quizzes", perf.getQuizAttempts().size());
                courseData.put("difficulty", perf.getCurrentDifficultyLevel());
                courseData.put("topics", perf.getTopicScores().keySet());
                courseData.put("topicScores", perf.getTopicScores()); // Add actual topic scores
                courseData.put("quizAttempts", perf.getQuizAttempts()); // Add quiz attempts for history
                courseProgressList.add(courseData);
            }
        }
        
        double avgScore = allPerformances.size() > 0 ? totalScore / allPerformances.size() : 0.0;
        
        overallData.put("totalCourses", allPerformances.size());
        overallData.put("totalQuizzes", totalQuizzes);
        overallData.put("overallScore", Math.round(avgScore * 100.0) / 100.0);
        overallData.put("totalTimeSpent", totalTime);
        overallData.put("courseProgress", courseProgressList);
        
        return overallData;
    }
    
    /**
     * Reset student performance for a course
     */
    public void resetPerformance(String studentEmail, String courseId) {
        performanceRepository.deleteByStudentEmailAndCourseId(studentEmail, courseId);
    }
}
