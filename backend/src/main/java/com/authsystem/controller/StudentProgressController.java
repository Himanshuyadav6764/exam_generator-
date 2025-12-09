package com.authsystem.controller;

import com.authsystem.model.StudentProgress;
import com.authsystem.repository.StudentProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "http://localhost:4200")
public class StudentProgressController {

    @Autowired
    private StudentProgressRepository progressRepository;

    // Get progress for a student in a specific course
    @GetMapping("/student/{email}/course/{courseId}")
    public ResponseEntity<?> getProgress(@PathVariable String email, @PathVariable String courseId) {
        System.out.println("📊 GET Progress - Email: " + email + ", CourseId: " + courseId);
        
        Optional<StudentProgress> progress = progressRepository.findByStudentEmailAndCourseId(email, courseId);
        
        if (progress.isPresent()) {
            System.out.println("✅ Progress found: " + progress.get().getOverallScore() + "% score");
            return ResponseEntity.ok(progress.get());
        } else {
            System.out.println("❌ No progress found, creating new...");
            // Create new progress entry
            StudentProgress newProgress = new StudentProgress();
            newProgress.setStudentEmail(email);
            newProgress.setCourseId(courseId);
            StudentProgress saved = progressRepository.save(newProgress);
            return ResponseEntity.ok(saved);
        }
    }

    // Record video watch time
    @PostMapping("/video-watch")
    public ResponseEntity<?> recordVideoWatch(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("studentEmail");
        String courseId = (String) request.get("courseId");
        String topicName = (String) request.get("topicName");
        Integer timeSpentSeconds = (Integer) request.get("timeSpentSeconds");
        String videoTitle = (String) request.get("videoTitle");

        System.out.println("🎥 Recording video watch - " + timeSpentSeconds + "s for " + videoTitle);

        StudentProgress progress = getOrCreateProgress(email, courseId);
        
        // Add time spent
        int minutesToAdd = timeSpentSeconds / 60;
        progress.setTotalTimeSpentMinutes(progress.getTotalTimeSpentMinutes() + minutesToAdd);
        
        // Update topic mastery
        updateTopicMastery(progress, topicName, timeSpentSeconds, false);
        
        // Add activity log
        addActivity(progress, "VIDEO", videoTitle, "Watched video for " + minutesToAdd + " minutes");
        
        // Update last activity
        progress.setLastActivityDate(LocalDateTime.now());
        progress.setUpdatedAt(LocalDateTime.now());
        
        StudentProgress saved = progressRepository.save(progress);
        System.out.println("✅ Total time spent: " + saved.getTotalTimeSpentMinutes() + " minutes");
        
        return ResponseEntity.ok(saved);
    }

    // Record PDF view time
    @PostMapping("/pdf-view")
    public ResponseEntity<?> recordPdfView(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("studentEmail");
        String courseId = (String) request.get("courseId");
        String topicName = (String) request.get("topicName");
        Integer timeSpentSeconds = (Integer) request.get("timeSpentSeconds");
        String pdfTitle = (String) request.get("pdfTitle");

        System.out.println("📄 Recording PDF view - " + timeSpentSeconds + "s for " + pdfTitle);

        StudentProgress progress = getOrCreateProgress(email, courseId);
        
        // Add time spent
        int minutesToAdd = timeSpentSeconds / 60;
        progress.setTotalTimeSpentMinutes(progress.getTotalTimeSpentMinutes() + minutesToAdd);
        
        // Update topic mastery
        updateTopicMastery(progress, topicName, timeSpentSeconds, false);
        
        // Add activity log
        addActivity(progress, "PDF", pdfTitle, "Viewed PDF for " + minutesToAdd + " minutes");
        
        progress.setLastActivityDate(LocalDateTime.now());
        progress.setUpdatedAt(LocalDateTime.now());
        
        StudentProgress saved = progressRepository.save(progress);
        return ResponseEntity.ok(saved);
    }

    // Record quiz attempt
    @PostMapping("/quiz-attempt")
    public ResponseEntity<?> recordQuizAttempt(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("studentEmail");
        String courseId = (String) request.get("courseId");
        String topicName = (String) request.get("topicName");
        Integer score = (Integer) request.get("score");
        Integer totalQuestions = (Integer) request.get("totalQuestions");
        Integer timeSpentSeconds = (Integer) request.get("timeSpentSeconds");
        String difficulty = (String) request.getOrDefault("difficulty", "MEDIUM");

        System.out.println("📝 Recording quiz attempt - Score: " + score + "/" + totalQuestions + " for topic: " + topicName);

        StudentProgress progress = getOrCreateProgress(email, courseId);
        
        // Calculate percentage
        double percentage = (score * 100.0) / totalQuestions;
        boolean passed = percentage >= 60; // 60% passing threshold
        
        // Create quiz attempt record
        StudentProgress.QuizAttempt attempt = new StudentProgress.QuizAttempt();
        attempt.setQuizId(topicName + "_" + System.currentTimeMillis());
        attempt.setQuizTitle(topicName + " Quiz");
        attempt.setScore(score);
        attempt.setTotalQuestions(totalQuestions);
        attempt.setDifficulty(difficulty);
        attempt.setAttemptedAt(LocalDateTime.now());
        attempt.setPassed(passed);
        
        progress.getQuizAttempts().add(attempt);
        
        // Update quiz count
        if (passed) {
            progress.setQuizzesPassed(progress.getQuizzesPassed() + 1);
        }
        
        // Update overall performance
        StudentProgress.OverallPerformance overall = progress.getOverallPerformance();
        overall.setTotalQuizzes(overall.getTotalQuizzes() + 1);
        
        // Recalculate average score
        double totalScore = 0;
        for (StudentProgress.QuizAttempt qa : progress.getQuizAttempts()) {
            totalScore += (qa.getScore() * 100.0) / qa.getTotalQuestions();
        }
        overall.setAverageScore(totalScore / progress.getQuizAttempts().size());
        
        // Update performance level
        if (overall.getAverageScore() >= 90) {
            overall.setPerformanceLevel("EXCELLENT");
        } else if (overall.getAverageScore() >= 75) {
            overall.setPerformanceLevel("GOOD");
        } else if (overall.getAverageScore() >= 60) {
            overall.setPerformanceLevel("AVERAGE");
        } else {
            overall.setPerformanceLevel("NEEDS_IMPROVEMENT");
        }
        
        // Add time spent
        int minutesToAdd = timeSpentSeconds / 60;
        progress.setTotalTimeSpentMinutes(progress.getTotalTimeSpentMinutes() + minutesToAdd);
        overall.setTotalTimeSpent(overall.getTotalTimeSpent() + timeSpentSeconds);
        
        // Update topic mastery with quiz results
        updateTopicMastery(progress, topicName, timeSpentSeconds, true, score, totalQuestions);
        
        // Calculate overall score (average of all quizzes)
        progress.setOverallScore(overall.getAverageScore());
        
        // Update level based on performance
        updateStudentLevel(progress);
        
        // Add activity log
        String resultText = passed ? "Passed ✅" : "Needs retry ⚠️";
        addActivity(progress, "QUIZ", topicName + " Quiz", 
            "Scored " + score + "/" + totalQuestions + " (" + Math.round(percentage) + "%) - " + resultText);
        
        progress.setLastActivityDate(LocalDateTime.now());
        progress.setUpdatedAt(LocalDateTime.now());
        
        StudentProgress saved = progressRepository.save(progress);
        System.out.println("✅ Quiz recorded - Overall Score: " + saved.getOverallScore() + "%, Level: " + saved.getCurrentLevel());
        
        return ResponseEntity.ok(saved);
    }

    // Mark lesson/topic as completed
    @PostMapping("/lesson-complete")
    public ResponseEntity<?> markLessonComplete(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("studentEmail");
        String courseId = (String) request.get("courseId");
        String lessonId = (String) request.get("lessonId");
        String lessonTitle = (String) request.get("lessonTitle");
        Integer timeSpentMinutes = (Integer) request.getOrDefault("timeSpentMinutes", 0);

        System.out.println("✓ Marking lesson complete: " + lessonTitle);

        StudentProgress progress = getOrCreateProgress(email, courseId);
        
        // Check if lesson already completed
        boolean alreadyCompleted = progress.getLessonProgressList().stream()
            .anyMatch(lp -> lp.getLessonId().equals(lessonId) && lp.isCompleted());
        
        if (!alreadyCompleted) {
            StudentProgress.LessonProgress lessonProgress = new StudentProgress.LessonProgress();
            lessonProgress.setLessonId(lessonId);
            lessonProgress.setLessonTitle(lessonTitle);
            lessonProgress.setCompleted(true);
            lessonProgress.setTimeSpentMinutes(timeSpentMinutes);
            lessonProgress.setCompletedAt(LocalDateTime.now());
            
            progress.getLessonProgressList().add(lessonProgress);
            progress.setLessonsCompleted(progress.getLessonsCompleted() + 1);
            
            addActivity(progress, "LESSON", lessonTitle, "Completed lesson");
        }
        
        progress.setLastActivityDate(LocalDateTime.now());
        progress.setUpdatedAt(LocalDateTime.now());
        
        StudentProgress saved = progressRepository.save(progress);
        return ResponseEntity.ok(saved);
    }

    // Get all progress for a student (across all courses)
    @GetMapping("/student/{email}")
    public ResponseEntity<?> getAllProgress(@PathVariable String email) {
        List<StudentProgress> progressList = progressRepository.findByStudentEmail(email);
        return ResponseEntity.ok(progressList);
    }

    // Helper methods
    private StudentProgress getOrCreateProgress(String email, String courseId) {
        Optional<StudentProgress> existing = progressRepository.findByStudentEmailAndCourseId(email, courseId);
        
        if (existing.isPresent()) {
            return existing.get();
        } else {
            StudentProgress newProgress = new StudentProgress();
            newProgress.setStudentEmail(email);
            newProgress.setCourseId(courseId);
            return progressRepository.save(newProgress);
        }
    }

    private void updateTopicMastery(StudentProgress progress, String topicName, int timeSpentSeconds, boolean isQuiz) {
        Map<String, StudentProgress.TopicMastery> topicMastery = progress.getTopicMastery();
        
        StudentProgress.TopicMastery mastery = topicMastery.computeIfAbsent(topicName, k -> new StudentProgress.TopicMastery());
        
        if (isQuiz) {
            mastery.setTotalAttempts(mastery.getTotalAttempts() + 1);
        }
        
        mastery.setTimeSpent(mastery.getTimeSpent() + timeSpentSeconds);
        mastery.setLastAttemptDate(LocalDateTime.now());
        
        topicMastery.put(topicName, mastery);
    }

    private void updateTopicMastery(StudentProgress progress, String topicName, int timeSpentSeconds, 
                                   boolean isQuiz, int score, int totalQuestions) {
        Map<String, StudentProgress.TopicMastery> topicMastery = progress.getTopicMastery();
        
        StudentProgress.TopicMastery mastery = topicMastery.computeIfAbsent(topicName, k -> new StudentProgress.TopicMastery());
        
        if (isQuiz) {
            mastery.setTotalAttempts(mastery.getTotalAttempts() + 1);
            mastery.setCorrectAnswers(mastery.getCorrectAnswers() + score);
            
            // Calculate average score
            double percentage = (score * 100.0) / totalQuestions;
            if (mastery.getTotalAttempts() == 1) {
                mastery.setAverageScore(percentage);
            } else {
                // Running average
                mastery.setAverageScore(
                    (mastery.getAverageScore() * (mastery.getTotalAttempts() - 1) + percentage) / mastery.getTotalAttempts()
                );
            }
            
            // Determine difficulty based on performance
            if (mastery.getAverageScore() >= 80) {
                mastery.setDifficulty("HARD");
            } else if (mastery.getAverageScore() >= 60) {
                mastery.setDifficulty("MEDIUM");
            } else {
                mastery.setDifficulty("EASY");
            }
        }
        
        mastery.setTimeSpent(mastery.getTimeSpent() + timeSpentSeconds);
        mastery.setLastAttemptDate(LocalDateTime.now());
        
        topicMastery.put(topicName, mastery);
    }

    private void updateStudentLevel(StudentProgress progress) {
        double score = progress.getOverallScore();
        int quizzesPassed = progress.getQuizzesPassed();
        
        if (score >= 90 && quizzesPassed >= 10) {
            progress.setCurrentLevel("MASTERY");
        } else if (score >= 75 && quizzesPassed >= 5) {
            progress.setCurrentLevel("ADVANCED");
        } else if (score >= 60 && quizzesPassed >= 3) {
            progress.setCurrentLevel("INTERMEDIATE");
        } else {
            progress.setCurrentLevel("BEGINNER");
        }
    }

    private void addActivity(StudentProgress progress, String type, String title, String description) {
        StudentProgress.ActivityLog activity = new StudentProgress.ActivityLog(type, title, description);
        
        List<StudentProgress.ActivityLog> activities = progress.getRecentActivities();
        activities.add(0, activity); // Add to beginning
        
        // Keep only last 20 activities
        if (activities.size() > 20) {
            activities = activities.subList(0, 20);
            progress.setRecentActivities(activities);
        }
    }

    // Save notes for a specific topic and subtopic
    @PostMapping("/notes/save")
    public ResponseEntity<?> saveNotes(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("studentEmail");
            String courseId = request.get("courseId");
            String topicName = request.get("topicName");
            String subtopicName = request.get("subtopicName");
            String notes = request.get("notes");

            System.out.println("📝 Saving notes for " + email + " - Topic: " + topicName + ", Subtopic: " + subtopicName);

            StudentProgress progress = getOrCreateProgress(email, courseId);
            
            // Initialize notes map if null
            if (progress.getNotes() == null) {
                progress.setNotes(new HashMap<>());
            }
            
            // Get or create topic notes map
            Map<String, String> topicNotes = progress.getNotes().get(topicName);
            if (topicNotes == null) {
                topicNotes = new HashMap<>();
                progress.getNotes().put(topicName, topicNotes);
            }
            
            // Save subtopic notes
            topicNotes.put(subtopicName, notes);
            
            progress.setUpdatedAt(LocalDateTime.now());
            StudentProgress saved = progressRepository.save(progress);
            
            System.out.println("✅ Notes saved successfully!");
            
            return ResponseEntity.ok(Map.of(
                "message", "Notes saved successfully",
                "notes", notes
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Error saving notes: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to save notes: " + e.getMessage()
            ));
        }
    }

    // Get notes for a specific topic and subtopic
    @GetMapping("/notes/{email}/{courseId}/{topicName}/{subtopicName}")
    public ResponseEntity<?> getNotes(
            @PathVariable String email,
            @PathVariable String courseId,
            @PathVariable String topicName,
            @PathVariable String subtopicName) {
        try {
            System.out.println("📖 Loading notes for " + email + " - Topic: " + topicName + ", Subtopic: " + subtopicName);

            Optional<StudentProgress> progressOpt = progressRepository.findByStudentEmailAndCourseId(email, courseId);
            
            if (progressOpt.isPresent()) {
                StudentProgress progress = progressOpt.get();
                
                if (progress.getNotes() != null && 
                    progress.getNotes().containsKey(topicName) &&
                    progress.getNotes().get(topicName).containsKey(subtopicName)) {
                    
                    String notes = progress.getNotes().get(topicName).get(subtopicName);
                    System.out.println("✅ Notes found: " + notes.length() + " characters");
                    
                    return ResponseEntity.ok(Map.of(
                        "notes", notes,
                        "topicName", topicName,
                        "subtopicName", subtopicName
                    ));
                }
            }
            
            System.out.println("⚠️ No notes found, returning empty");
            return ResponseEntity.ok(Map.of(
                "notes", "",
                "topicName", topicName,
                "subtopicName", subtopicName
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Error loading notes: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to load notes: " + e.getMessage()
            ));
        }
    }
}
