package com.authsystem.controller;

import com.authsystem.model.Course;
import com.authsystem.model.User;
import com.authsystem.repository.CourseRepository;
import com.authsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = {"http://localhost:4200", "*"})
public class StudentController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CourseRepository courseRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String, Object> getStudentDashboard() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Welcome to Student Dashboard");
        response.put("role", "STUDENT");
        response.put("features", new String[]{
            "View Courses", 
            "My Learning", 
            "Assignments", 
            "Grades",
            "Progress Tracking"
        });
        return response;
    }

    @GetMapping("/courses")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String, Object> getMyCourses() {
        Map<String, Object> response = new HashMap<>();
        response.put("courses", new String[]{
            "Java Programming",
            "Spring Boot Masterclass",
            "Angular Development",
            "MongoDB Database"
        });
        return response;
    }
    
    /**
     * Add a course to student's recommendations
     * Called when student clicks/views a course from search
     */
    @PostMapping("/{email}/recommendations/add")
    public ResponseEntity<?> addRecommendation(
            @PathVariable String email,
            @RequestBody Map<String, String> request) {
        try {
            System.out.println("🔵 ADD RECOMMENDATION REQUEST for: " + email);
            System.out.println("🔵 Request body: " + request);
            
            String courseId = request.get("courseId");
            
            if (courseId == null || courseId.trim().isEmpty()) {
                System.err.println("❌ Course ID is missing or empty");
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Course ID is required"));
            }
            
            System.out.println("🔵 Looking for student with email: " + email);
            
            // Find student by email
            User student = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Student not found with email: " + email));
            
            System.out.println("✅ Found student: " + student.getFullName());
            
            // Verify course exists
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found with ID: " + courseId));
            
            System.out.println("✅ Found course: " + course.getTitle());
            
            // Initialize recommendations list if null
            if (student.getRecommendations() == null) {
                student.setRecommendations(new ArrayList<>());
                System.out.println("📝 Initialized empty recommendations list");
            }
            
            // Check if already in recommendations
            boolean alreadyExists = student.getRecommendations().stream()
                    .anyMatch(rec -> rec.getCourseId().equals(courseId));
            
            if (!alreadyExists) {
                // Add new recommendation
                student.getRecommendations().add(
                        new User.CourseRecommendation(courseId));
                userRepository.save(student);
                
                System.out.println("✅ Added course " + course.getTitle() + 
                        " to recommendations for " + email);
                
                return ResponseEntity.ok(Map.of(
                        "message", "Course added to recommendations",
                        "courseTitle", course.getTitle()));
            } else {
                // Update timestamp by removing and re-adding
                student.getRecommendations().removeIf(rec -> 
                        rec.getCourseId().equals(courseId));
                student.getRecommendations().add(
                        new User.CourseRecommendation(courseId));
                userRepository.save(student);
                
                return ResponseEntity.ok(Map.of(
                        "message", "Recommendation updated",
                        "courseTitle", course.getTitle()));
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error adding recommendation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to add recommendation: " + e.getMessage()));
        }
    }
    
    /**
     * Get student's recommended courses (up to 6 recent)
     */
    @GetMapping("/{email}/recommendations")
    public ResponseEntity<?> getRecommendations(@PathVariable String email) {
        try {
            // Find student
            User student = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Student not found"));
            
            if (student.getRecommendations() == null || 
                    student.getRecommendations().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "recommendations", List.of(),
                        "message", "No recommendations yet"));
            }
            
            // Sort by savedAt descending and take top 6
            List<User.CourseRecommendation> recentRecs = student.getRecommendations()
                    .stream()
                    .sorted((a, b) -> b.getSavedAt().compareTo(a.getSavedAt()))
                    .limit(6)
                    .collect(Collectors.toList());
            
            // Fetch course details for each recommendation
            List<Map<String, Object>> recommendedCourses = new ArrayList<>();
            
            for (User.CourseRecommendation rec : recentRecs) {
                Optional<Course> courseOpt = courseRepository.findById(rec.getCourseId());
                
                if (courseOpt.isPresent()) {
                    Course course = courseOpt.get();
                    Map<String, Object> courseData = new HashMap<>();
                    courseData.put("id", course.getId());
                    courseData.put("title", course.getTitle());
                    courseData.put("description", course.getDescription());
                    courseData.put("thumbnail", course.getThumbnail());
                    courseData.put("difficulty", course.getDifficulty());
                    courseData.put("instructorName", course.getInstructorName());
                    courseData.put("subjects", course.getSubjects());
                    courseData.put("savedAt", rec.getSavedAt());
                    
                    // Calculate topic count
                    int topicCount = course.getTopics() != null ? 
                            course.getTopics().size() : 0;
                    courseData.put("topicCount", topicCount);
                    
                    recommendedCourses.add(courseData);
                }
            }
            
            System.out.println("📚 Fetched " + recommendedCourses.size() + 
                    " recommendations for " + email);
            
            return ResponseEntity.ok(Map.of(
                    "recommendations", recommendedCourses,
                    "total", recommendedCourses.size()));
            
        } catch (Exception e) {
            System.err.println("❌ Error fetching recommendations: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch recommendations: " + 
                            e.getMessage()));
        }
    }
    
    /**
     * Delete a course from student's recommendations
     */
    @DeleteMapping("/{email}/recommendations/{courseId}")
    public ResponseEntity<?> deleteRecommendation(
            @PathVariable String email,
            @PathVariable String courseId) {
        try {
            // Find student
            User student = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Student not found"));
            
            if (student.getRecommendations() == null || 
                    student.getRecommendations().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "message", "No recommendations to delete"));
            }
            
            // Remove recommendation with matching courseId
            boolean removed = student.getRecommendations()
                    .removeIf(rec -> rec.getCourseId().equals(courseId));
            
            if (removed) {
                userRepository.save(student);
                System.out.println("✅ Removed course " + courseId + 
                        " from recommendations for " + email);
                
                return ResponseEntity.ok(Map.of(
                        "message", "Recommendation deleted successfully",
                        "courseId", courseId));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Recommendation not found"));
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting recommendation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete recommendation: " + 
                            e.getMessage()));
        }
    }
}
