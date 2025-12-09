package com.authsystem.controller;

import com.authsystem.model.*;
import com.authsystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;
    
    @Autowired
    private TopicRepository topicRepository;
    
    @Autowired
    private VideoRepository videoRepository;
    
    @Autowired
    private PDFRepository pdfRepository;
    
    @Autowired
    private MCQRepository mcqRepository;

    /**
     * Get personalized content recommendations based on student's performance
     */
    @GetMapping("/student/{email}")
    public ResponseEntity<?> getRecommendations(@PathVariable String email) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Get all quiz attempts for the student
            List<QuizAttempt> attempts = quizAttemptRepository.findByStudentEmail(email);
            
            if (attempts.isEmpty()) {
                response.put("message", "No quiz attempts found. Start taking quizzes to get personalized recommendations!");
                response.put("recommendations", new ArrayList<>());
                return ResponseEntity.ok(response);
            }
            
            // Analyze performance
            Map<String, TopicPerformance> topicPerformanceMap = analyzePerformance(attempts);
            
            // Generate recommendations
            List<Map<String, Object>> recommendations = generateRecommendations(topicPerformanceMap);
            
            // Calculate overall stats
            double avgScore = attempts.stream()
                .mapToDouble(QuizAttempt::getScore)
                .average()
                .orElse(0.0);
            
            response.put("overallScore", Math.round(avgScore * 100.0) / 100.0);
            response.put("totalAttempts", attempts.size());
            response.put("recommendations", recommendations);
            response.put("weakTopics", getWeakTopics(topicPerformanceMap));
            response.put("strongTopics", getStrongTopics(topicPerformanceMap));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to generate recommendations: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    private Map<String, TopicPerformance> analyzePerformance(List<QuizAttempt> attempts) {
        Map<String, TopicPerformance> performanceMap = new HashMap<>();
        
        for (QuizAttempt attempt : attempts) {
            String topicName = attempt.getTopicName();
            
            TopicPerformance perf = performanceMap.computeIfAbsent(topicName, k -> new TopicPerformance(topicName));
            perf.addAttempt(attempt.getScore(), attempt.getDifficulty());
        }
        
        return performanceMap;
    }
    
    private List<Map<String, Object>> generateRecommendations(Map<String, TopicPerformance> performanceMap) {
        List<Map<String, Object>> recommendations = new ArrayList<>();
        
        // Sort topics by average score (weakest first)
        List<TopicPerformance> sortedPerformance = performanceMap.values().stream()
            .sorted(Comparator.comparingDouble(TopicPerformance::getAverageScore))
            .limit(5) // Top 5 weakest topics
            .collect(Collectors.toList());
        
        for (TopicPerformance perf : sortedPerformance) {
            Map<String, Object> recommendation = new HashMap<>();
            
            String topicName = perf.getTopicName();
            double avgScore = perf.getAverageScore();
            
            // Find topic details
            List<Topic> topics = topicRepository.findByName(topicName);
            
            if (!topics.isEmpty()) {
                Topic topic = topics.get(0);
                
                // Get learning materials for this topic
                List<Video> videos = videoRepository.findByTopicId(topic.getId());
                List<PDF> pdfs = pdfRepository.findByTopicId(topic.getId());
                List<MCQ> mcqs = mcqRepository.findByTopicId(topic.getId());
                
                recommendation.put("topicId", topic.getId());
                recommendation.put("topicName", topicName);
                recommendation.put("averageScore", Math.round(avgScore * 100.0) / 100.0);
                recommendation.put("attempts", perf.getAttemptCount());
                recommendation.put("priority", getPriority(avgScore));
                recommendation.put("suggestion", getSuggestion(avgScore, perf.getAttemptCount()));
                recommendation.put("videosAvailable", videos.size());
                recommendation.put("pdfsAvailable", pdfs.size());
                recommendation.put("mcqsAvailable", mcqs.size());
                
                // Recommend specific content type based on performance
                if (avgScore < 50) {
                    recommendation.put("recommendedAction", "Watch video lectures");
                    recommendation.put("recommendedContentType", "VIDEO");
                } else if (avgScore < 70) {
                    recommendation.put("recommendedAction", "Review PDF materials");
                    recommendation.put("recommendedContentType", "PDF");
                } else {
                    recommendation.put("recommendedAction", "Practice more MCQs");
                    recommendation.put("recommendedContentType", "MCQ");
                }
                
                recommendations.add(recommendation);
            }
        }
        
        return recommendations;
    }
    
    private List<Map<String, Object>> getWeakTopics(Map<String, TopicPerformance> performanceMap) {
        return performanceMap.values().stream()
            .filter(perf -> perf.getAverageScore() < 60)
            .map(perf -> {
                Map<String, Object> topic = new HashMap<>();
                topic.put("name", perf.getTopicName());
                topic.put("score", Math.round(perf.getAverageScore() * 100.0) / 100.0);
                topic.put("attempts", perf.getAttemptCount());
                return topic;
            })
            .sorted(Comparator.comparingDouble(t -> (Double) t.get("score")))
            .limit(3)
            .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getStrongTopics(Map<String, TopicPerformance> performanceMap) {
        return performanceMap.values().stream()
            .filter(perf -> perf.getAverageScore() >= 80)
            .map(perf -> {
                Map<String, Object> topic = new HashMap<>();
                topic.put("name", perf.getTopicName());
                topic.put("score", Math.round(perf.getAverageScore() * 100.0) / 100.0);
                topic.put("attempts", perf.getAttemptCount());
                return topic;
            })
            .sorted(Comparator.comparingDouble(t -> -(Double) t.get("score")))
            .limit(3)
            .collect(Collectors.toList());
    }
    
    private String getPriority(double avgScore) {
        if (avgScore < 50) return "HIGH";
        if (avgScore < 70) return "MEDIUM";
        return "LOW";
    }
    
    private String getSuggestion(double avgScore, int attempts) {
        if (avgScore < 40) {
            return "Focus on fundamental concepts. Watch video lectures and review materials carefully.";
        } else if (avgScore < 60) {
            return "Good progress! Review the topics and practice more to strengthen understanding.";
        } else if (avgScore < 80) {
            return "You're doing well! Practice advanced problems to master this topic.";
        } else {
            return "Excellent work! Continue practicing to maintain mastery.";
        }
    }
    
    // Helper class to track topic performance
    private static class TopicPerformance {
        private String topicName;
        private List<Double> scores = new ArrayList<>();
        private List<String> difficulties = new ArrayList<>();
        
        public TopicPerformance(String topicName) {
            this.topicName = topicName;
        }
        
        public void addAttempt(double score, String difficulty) {
            scores.add(score);
            difficulties.add(difficulty);
        }
        
        public String getTopicName() {
            return topicName;
        }
        
        public double getAverageScore() {
            return scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        }
        
        public int getAttemptCount() {
            return scores.size();
        }
    }
}
