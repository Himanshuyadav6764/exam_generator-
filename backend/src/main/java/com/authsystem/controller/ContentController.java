package com.authsystem.controller;

import com.authsystem.model.*;
import com.authsystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * ContentController - Handles hierarchical content queries
 * Returns complete Subject→Topic→Videos/PDFs/MCQs trees for GFG-style course display
 */
@RestController
@RequestMapping("/api/content")
@CrossOrigin(origins = "*")
public class ContentController {

    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private TopicRepository topicRepository;
    
    @Autowired
    private VideoRepository videoRepository;
    
    @Autowired
    private PDFRepository pdfRepository;
    
    @Autowired
    private MCQRepository mcqRepository;

    /**
     * GET /api/content/subject/{id}/complete
     * Get complete hierarchical structure for a subject
     * Returns Subject with nested Topics, each containing Videos, PDFs, and MCQs
     */
    @GetMapping("/subject/{id}/complete")
    public ResponseEntity<?> getCompleteSubjectContent(@PathVariable String id) {
        try {
            // Get subject
            Optional<Subject> subjectOptional = subjectRepository.findById(id);
            if (!subjectOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Subject subject = subjectOptional.get();
            
            // Get all topics for this subject (ordered)
            List<Topic> topics = topicRepository.findBySubjectIdOrderByOrderIndexAsc(id);
            
            // Build hierarchical structure
            Map<String, Object> result = new HashMap<>();
            result.put("subject", subject);
            
            List<Map<String, Object>> topicsWithContent = new ArrayList<>();
            
            for (Topic topic : topics) {
                Map<String, Object> topicData = new HashMap<>();
                topicData.put("topic", topic);
                
                // Get all content for this topic
                List<Video> videos = videoRepository.findByTopicIdOrderByOrderIndexAsc(topic.getId());
                List<PDF> pdfs = pdfRepository.findByTopicIdOrderByOrderIndexAsc(topic.getId());
                List<MCQ> mcqs = mcqRepository.findByTopicId(topic.getId());
                
                topicData.put("videos", videos);
                topicData.put("pdfs", pdfs);
                topicData.put("mcqs", mcqs);
                
                // Add counts
                topicData.put("videoCount", videos.size());
                topicData.put("pdfCount", pdfs.size());
                topicData.put("mcqCount", mcqs.size());
                
                topicsWithContent.add(topicData);
            }
            
            result.put("topics", topicsWithContent);
            result.put("topicCount", topics.size());
            
            // Calculate total content counts
            result.put("totalVideos", videoRepository.countBySubjectId(id));
            result.put("totalPDFs", pdfRepository.countBySubjectId(id));
            result.put("totalMCQs", mcqRepository.countBySubjectId(id));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching complete content: " + e.getMessage());
        }
    }

    /**
     * GET /api/content/subject/{id}/summary
     * Get subject summary with topic list (without full content)
     */
    @GetMapping("/subject/{id}/summary")
    public ResponseEntity<?> getSubjectSummary(@PathVariable String id) {
        try {
            Optional<Subject> subjectOptional = subjectRepository.findById(id);
            if (!subjectOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Subject subject = subjectOptional.get();
            List<Topic> topics = topicRepository.findBySubjectIdOrderByOrderIndexAsc(id);
            
            Map<String, Object> result = new HashMap<>();
            result.put("subject", subject);
            result.put("topics", topics);
            result.put("topicCount", topics.size());
            result.put("totalVideos", videoRepository.countBySubjectId(id));
            result.put("totalPDFs", pdfRepository.countBySubjectId(id));
            result.put("totalMCQs", mcqRepository.countBySubjectId(id));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching summary: " + e.getMessage());
        }
    }

    /**
     * GET /api/content/topic/{id}/complete
     * Get complete content for a single topic
     */
    @GetMapping("/topic/{id}/complete")
    public ResponseEntity<?> getCompleteTopicContent(@PathVariable String id) {
        try {
            Optional<Topic> topicOptional = topicRepository.findById(id);
            if (!topicOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Topic topic = topicOptional.get();
            
            Map<String, Object> result = new HashMap<>();
            result.put("topic", topic);
            
            // Get all content
            List<Video> videos = videoRepository.findByTopicIdOrderByOrderIndexAsc(id);
            List<PDF> pdfs = pdfRepository.findByTopicIdOrderByOrderIndexAsc(id);
            List<MCQ> mcqs = mcqRepository.findByTopicId(id);
            
            result.put("videos", videos);
            result.put("pdfs", pdfs);
            result.put("mcqs", mcqs);
            
            result.put("videoCount", videos.size());
            result.put("pdfCount", pdfs.size());
            result.put("mcqCount", mcqs.size());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching topic content: " + e.getMessage());
        }
    }

    /**
     * GET /api/content/difficulty/{level}
     * Get all content by difficulty level
     */
    @GetMapping("/difficulty/{level}")
    public ResponseEntity<?> getContentByDifficulty(@PathVariable String level) {
        try {
            String difficulty = level.toUpperCase();
            
            Map<String, Object> result = new HashMap<>();
            
            List<Subject> subjects = subjectRepository.findByDifficulty(difficulty);
            List<Topic> topics = topicRepository.findByDifficulty(difficulty);
            List<Video> videos = videoRepository.findByDifficulty(difficulty);
            List<PDF> pdfs = pdfRepository.findByDifficulty(difficulty);
            List<MCQ> mcqs = mcqRepository.findByDifficulty(difficulty);
            
            result.put("difficulty", difficulty);
            result.put("subjects", subjects);
            result.put("topics", topics);
            result.put("videos", videos);
            result.put("pdfs", pdfs);
            result.put("mcqs", mcqs);
            
            result.put("subjectCount", subjects.size());
            result.put("topicCount", topics.size());
            result.put("videoCount", videos.size());
            result.put("pdfCount", pdfs.size());
            result.put("mcqCount", mcqs.size());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching content by difficulty: " + e.getMessage());
        }
    }

    /**
     * GET /api/content/preview
     * Get all preview/free content
     */
    @GetMapping("/preview")
    public ResponseEntity<?> getPreviewContent() {
        try {
            // Get all published subjects
            List<Subject> subjects = subjectRepository.findByStatus("PUBLISHED");
            
            // Get preview videos
            List<Video> previewVideos = videoRepository.findByIsPreview(true);
            
            // Get downloadable PDFs (considered free access)
            List<PDF> freePDFs = pdfRepository.findByIsDownloadable(true);
            
            Map<String, Object> result = new HashMap<>();
            result.put("subjects", subjects);
            result.put("previewVideos", previewVideos);
            result.put("freePDFs", freePDFs);
            
            result.put("subjectCount", subjects.size());
            result.put("previewVideoCount", previewVideos.size());
            result.put("freePDFCount", freePDFs.size());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching preview content: " + e.getMessage());
        }
    }

    /**
     * GET /api/content/instructor/{email}
     * Get all content by instructor
     */
    @GetMapping("/instructor/{email}")
    public ResponseEntity<?> getContentByInstructor(@PathVariable String email) {
        try {
            // Get subjects by instructor
            List<Subject> subjects = subjectRepository.findByInstructorEmail(email);
            
            Map<String, Object> result = new HashMap<>();
            result.put("instructorEmail", email);
            result.put("subjects", subjects);
            
            // Get all topics under these subjects
            List<Map<String, Object>> subjectsWithContent = new ArrayList<>();
            
            int totalTopics = 0;
            int totalVideos = 0;
            int totalPDFs = 0;
            int totalMCQs = 0;
            
            for (Subject subject : subjects) {
                Map<String, Object> subjectData = new HashMap<>();
                subjectData.put("subject", subject);
                
                List<Topic> topics = topicRepository.findBySubjectIdOrderByOrderIndexAsc(subject.getId());
                Long videoCount = videoRepository.countBySubjectId(subject.getId());
                Long pdfCount = pdfRepository.countBySubjectId(subject.getId());
                Long mcqCount = mcqRepository.countBySubjectId(subject.getId());
                
                subjectData.put("topicCount", topics.size());
                subjectData.put("videoCount", videoCount);
                subjectData.put("pdfCount", pdfCount);
                subjectData.put("mcqCount", mcqCount);
                
                totalTopics += topics.size();
                totalVideos += videoCount;
                totalPDFs += pdfCount;
                totalMCQs += mcqCount;
                
                subjectsWithContent.add(subjectData);
            }
            
            result.put("subjectsWithStats", subjectsWithContent);
            result.put("totalSubjects", subjects.size());
            result.put("totalTopics", totalTopics);
            result.put("totalVideos", totalVideos);
            result.put("totalPDFs", totalPDFs);
            result.put("totalMCQs", totalMCQs);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching instructor content: " + e.getMessage());
        }
    }

    /**
     * GET /api/content/search
     * Search across all content types
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchContent(@RequestParam String query) {
        try {
            String searchQuery = query.toLowerCase();
            
            // Search subjects by title
            List<Subject> subjects = subjectRepository.findAll().stream()
                .filter(s -> s.getTitle().toLowerCase().contains(searchQuery) ||
                           (s.getDescription() != null && s.getDescription().toLowerCase().contains(searchQuery)))
                .toList();
            
            // Search topics by name
            List<Topic> topics = topicRepository.findAll().stream()
                .filter(t -> t.getName().toLowerCase().contains(searchQuery) ||
                           (t.getDescription() != null && t.getDescription().toLowerCase().contains(searchQuery)))
                .toList();
            
            // Search videos by title
            List<Video> videos = videoRepository.findAll().stream()
                .filter(v -> v.getTitle().toLowerCase().contains(searchQuery) ||
                           (v.getDescription() != null && v.getDescription().toLowerCase().contains(searchQuery)))
                .toList();
            
            // Search PDFs by title
            List<PDF> pdfs = pdfRepository.findAll().stream()
                .filter(p -> p.getTitle().toLowerCase().contains(searchQuery) ||
                           (p.getDescription() != null && p.getDescription().toLowerCase().contains(searchQuery)))
                .toList();
            
            // Search MCQs by question
            List<MCQ> mcqs = mcqRepository.findAll().stream()
                .filter(m -> m.getQuestion().toLowerCase().contains(searchQuery))
                .toList();
            
            Map<String, Object> result = new HashMap<>();
            result.put("query", query);
            result.put("subjects", subjects);
            result.put("topics", topics);
            result.put("videos", videos);
            result.put("pdfs", pdfs);
            result.put("mcqs", mcqs);
            
            result.put("subjectCount", subjects.size());
            result.put("topicCount", topics.size());
            result.put("videoCount", videos.size());
            result.put("pdfCount", pdfs.size());
            result.put("mcqCount", mcqs.size());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error searching content: " + e.getMessage());
        }
    }

    /**
     * GET /api/content/stats
     * Get global content statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getGlobalStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // Total counts
            stats.put("totalSubjects", subjectRepository.count());
            stats.put("totalTopics", topicRepository.count());
            stats.put("totalVideos", videoRepository.count());
            stats.put("totalPDFs", pdfRepository.count());
            stats.put("totalMCQs", mcqRepository.count());
            
            // By difficulty
            Map<String, Object> byDifficulty = new HashMap<>();
            for (String level : Arrays.asList("BEGINNER", "INTERMEDIATE", "ADVANCED")) {
                Map<String, Object> diffStats = new HashMap<>();
                diffStats.put("subjects", subjectRepository.findByDifficulty(level).size());
                diffStats.put("topics", topicRepository.findByDifficulty(level).size());
                diffStats.put("videos", videoRepository.findByDifficulty(level).size());
                diffStats.put("pdfs", pdfRepository.findByDifficulty(level).size());
                diffStats.put("mcqs", mcqRepository.findByDifficulty(level).size());
                byDifficulty.put(level, diffStats);
            }
            stats.put("byDifficulty", byDifficulty);
            
            // By status
            Map<String, Long> byStatus = new HashMap<>();
            byStatus.put("DRAFT", subjectRepository.findByStatus("DRAFT").stream().count());
            byStatus.put("PUBLISHED", subjectRepository.findByStatus("PUBLISHED").stream().count());
            stats.put("subjectsByStatus", byStatus);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching global stats: " + e.getMessage());
        }
    }
}
