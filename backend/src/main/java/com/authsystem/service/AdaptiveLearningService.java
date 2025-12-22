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
     * @param quizId - "AI_QUIZ" for AI-generated quizzes, null or UUID for normal MCQs
     */
    public StudentPerformance recordQuizAttempt(String studentEmail, String courseId, 
                                                String topicName, int score, int totalQuestions,
                                                DifficultyLevel difficultyLevel, long timeSpent, String quizId) {
        
        // Get or create performance record
        StudentPerformance performance = performanceRepository
            .findByStudentEmailAndCourseId(studentEmail, courseId)
            .orElse(new StudentPerformance(studentEmail, courseId));
        
        // Add quiz attempt
        // Use "AI_QUIZ" for AI-generated quizzes, or generate UUID for normal MCQs
        String finalQuizId = (quizId != null && !quizId.isEmpty()) ? quizId : UUID.randomUUID().toString();
        QuizAttempt attempt = new QuizAttempt(
            finalQuizId,
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
        
        System.out.println("📊 Calculating overall progress for: " + studentEmail);
        System.out.println("   Found " + allPerformances.size() + " performance records");
        
        if (allPerformances.isEmpty()) {
            overallData.put("totalCourses", 0);
            overallData.put("totalQuizAttempts", 0);
            overallData.put("overallScore", 0.0);
            overallData.put("averageAccuracy", 0.0);
            overallData.put("totalTimeSpent", 0L);
            overallData.put("currentLevel", "Beginner");
            overallData.put("topicsStudied", 0);
            overallData.put("topicPerformance", new HashMap<>());
            overallData.put("allQuizAttempts", new ArrayList<>());
            overallData.put("courseProgress", new ArrayList<>());
            return overallData;
        }
        
        // Aggregate data across all courses
        int totalQuizzes = 0;
        int aiQuizCount = 0;
        int normalQuizCount = 0;
        long totalTime = 0;
        double totalScore = 0;
        double totalAccuracy = 0;
        int accuracyCount = 0;
        List<Map<String, Object>> courseProgressList = new ArrayList<>();
        List<StudentPerformance.QuizAttempt> allQuizAttempts = new ArrayList<>();
        Map<String, Map<String, Object>> topicPerformanceMap = new HashMap<>();
        Set<String> allTopics = new HashSet<>();
        
        // Determine current level based on highest difficulty achieved
        DifficultyLevel highestLevel = DifficultyLevel.BEGINNER;
        
        for (StudentPerformance perf : allPerformances) {
            // Collect all quiz attempts
            List<StudentPerformance.QuizAttempt> courseQuizzes = perf.getQuizAttempts();
            allQuizAttempts.addAll(courseQuizzes);
            totalQuizzes += courseQuizzes.size();
            
            // Count AI vs Normal quizzes
            for (StudentPerformance.QuizAttempt attempt : courseQuizzes) {
                if ("ai".equalsIgnoreCase(attempt.getQuizType())) {
                    aiQuizCount++;
                } else {
                    normalQuizCount++;
                }
            }
            
            System.out.println("   Course " + perf.getCourseId() + ": " + courseQuizzes.size() + " quiz attempts");
            
            // Calculate time spent
            totalTime += perf.getTimeSpentPerTopic().values().stream().mapToLong(Long::longValue).sum();
            
            // Track highest difficulty level
            if (perf.getCurrentDifficultyLevel().ordinal() > highestLevel.ordinal()) {
                highestLevel = perf.getCurrentDifficultyLevel();
            }
            
            // Calculate average score for this course
            if (!perf.getTopicScores().isEmpty()) {
                double courseScore = perf.getTopicScores().values().stream()
                    .mapToDouble(Integer::doubleValue)
                    .average()
                    .orElse(0.0);
                totalScore += courseScore;
                
                // Process topic scores
                perf.getTopicScores().forEach((topic, score) -> {
                    allTopics.add(topic);
                    if (!topicPerformanceMap.containsKey(topic)) {
                        Map<String, Object> topicData = new HashMap<>();
                        topicData.put("averageScore", 0.0);
                        topicData.put("attempts", 0);
                        topicData.put("totalScore", 0.0);
                        topicPerformanceMap.put(topic, topicData);
                    }
                    
                    Map<String, Object> topicData = topicPerformanceMap.get(topic);
                    int attempts = (int) topicData.get("attempts") + 1;
                    double totalTopicScore = (double) topicData.get("totalScore") + score;
                    topicData.put("attempts", attempts);
                    topicData.put("totalScore", totalTopicScore);
                    topicData.put("averageScore", totalTopicScore / attempts);
                });
                
                // Calculate accuracy from quiz attempts
                for (StudentPerformance.QuizAttempt attempt : perf.getQuizAttempts()) {
                    double accuracy = (attempt.getScore() * 100.0) / attempt.getTotalQuestions();
                    totalAccuracy += accuracy;
                    accuracyCount++;
                }
                
                // Add course-specific progress
                Map<String, Object> courseData = new HashMap<>();
                courseData.put("courseId", perf.getCourseId());
                courseData.put("score", Math.round(courseScore * 100.0) / 100.0);
                courseData.put("quizzes", perf.getQuizAttempts().size());
                courseData.put("difficulty", perf.getCurrentDifficultyLevel().toString());
                courseData.put("topics", perf.getTopicScores().keySet());
                courseData.put("topicScores", perf.getTopicScores());
                courseData.put("quizAttempts", perf.getQuizAttempts());
                courseProgressList.add(courseData);
            }
        }
        
        double avgScore = allPerformances.size() > 0 ? totalScore / allPerformances.size() : 0.0;
        double avgAccuracy = accuracyCount > 0 ? totalAccuracy / accuracyCount : 0.0;
        
        // Convert level to friendly format
        String currentLevel;
        if (highestLevel == DifficultyLevel.BEGINNER) {
            currentLevel = "Beginner";
        } else if (highestLevel == DifficultyLevel.INTERMEDIATE) {
            currentLevel = "Intermediate";
        } else if (highestLevel == DifficultyLevel.ADVANCED) {
            currentLevel = "Advanced";
        } else {
            currentLevel = "Beginner";
        }
        
        System.out.println("📈 Overall Statistics:");
        System.out.println("   Total Quiz Attempts: " + totalQuizzes + " (AI: " + aiQuizCount + ", Normal: " + normalQuizCount + ")");
        System.out.println("   Overall Score: " + avgScore);
        System.out.println("   Average Accuracy: " + avgAccuracy);
        System.out.println("   Topics Studied: " + allTopics.size());
        System.out.println("   Current Level: " + currentLevel);
        
        overallData.put("totalCourses", allPerformances.size());
        overallData.put("totalQuizAttempts", totalQuizzes);
        overallData.put("aiQuizCount", aiQuizCount);
        overallData.put("normalQuizCount", normalQuizCount);
        overallData.put("overallScore", Math.round(avgScore * 100.0) / 100.0);
        overallData.put("averageAccuracy", Math.round(avgAccuracy * 100.0) / 100.0);
        overallData.put("totalTimeSpent", totalTime);
        overallData.put("currentLevel", currentLevel);
        overallData.put("topicsStudied", allTopics.size());
        overallData.put("topicPerformance", topicPerformanceMap);
        overallData.put("allQuizAttempts", allQuizAttempts);
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
