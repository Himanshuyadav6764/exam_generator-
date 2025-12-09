package com.authsystem.controller;

import com.authsystem.model.*;
import com.authsystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestDataController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private TopicRepository topicRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private SubContentRepository subContentRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private MaterialRepository materialRepository;
    
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Generate sample data to test MongoDB mappings
     * POST http://localhost:8081/api/test/generate-sample-data
     */
    @PostMapping("/generate-sample-data")
    public ResponseEntity<?> generateSampleData() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 1. Create Subject
            Subject javaSubject = new Subject();
            javaSubject.setName("Java Programming");
            javaSubject.setDescription("Complete Java programming from basics to advanced");
            javaSubject.setCategory("Programming");
            javaSubject.setActive(true);
            javaSubject = subjectRepository.save(javaSubject);
            result.put("subject_created", javaSubject.getName());
            
            // 2. Create Topics for Java Subject
            Topic variablesTopic = new Topic();
            variablesTopic.setSubjectId(javaSubject.getId());
            variablesTopic.setName("Variables and Data Types");
            variablesTopic.setDescription("Understanding Java variables, primitive types, and reference types");
            variablesTopic.setDifficulty("BEGINNER");
            variablesTopic.setOrderIndex(1);
            variablesTopic.setEstimatedHours(5);
            variablesTopic.setActive(true);
            variablesTopic = topicRepository.save(variablesTopic);
            
            Topic oopTopic = new Topic();
            oopTopic.setSubjectId(javaSubject.getId());
            oopTopic.setName("Object-Oriented Programming");
            oopTopic.setDescription("Classes, Objects, Inheritance, Polymorphism, Encapsulation");
            oopTopic.setDifficulty("INTERMEDIATE");
            oopTopic.setOrderIndex(2);
            oopTopic.setEstimatedHours(10);
            oopTopic.setActive(true);
            oopTopic = topicRepository.save(oopTopic);
            
            result.put("topics_created", Arrays.asList(variablesTopic.getName(), oopTopic.getName()));
            
            // 3. Find or Create Instructor User
            User instructor = userRepository.findByEmail("himanshu@instructor.com").orElse(null);
            if (instructor == null) {
                instructor = new User();
                instructor.setEmail("himanshu@instructor.com");
                instructor.setFullName("Himanshu Yadav");
                instructor.setRole("INSTRUCTOR");
                instructor.setPhone("1234567890");
                instructor.setPassword(passwordEncoder.encode("instructor123"));
                instructor.setEnabled(true);
                instructor = userRepository.save(instructor);
            }
            result.put("instructor", instructor.getEmail());
            
            // 4. Create Course
            Course course = new Course();
            course.setTitle("Complete Java Programming Masterclass");
            course.setDescription("Learn Java from scratch to advanced level with hands-on projects");
            course.setInstructorEmail(instructor.getEmail());
            course.setInstructorName(instructor.getFullName());
            course.setSubjects(Arrays.asList("Java Programming", "OOP"));
            course.setTopics(Arrays.asList("Variables", "Data Types", "Classes", "Inheritance"));
            course.setDifficulty("BEGINNER");
            course.setThumbnail("https://example.com/thumbnails/java-course.jpg");
            course.setStatus("PUBLISHED");
            course.setEnrolledStudents(0);
            course.setAverageRating(0.0);
            course = courseRepository.save(course);
            result.put("course_created", course.getTitle());
            
            // 5. Create SubContent (Video)
            SubContent videoContent = new SubContent();
            videoContent.setCourseId(course.getId());
            videoContent.setTitle("Introduction to Java Variables");
            videoContent.setDescription("Learn about Java variables and data types in this comprehensive introduction");
            videoContent.setContentType("VIDEO");
            videoContent.setUrl("https://www.youtube.com/watch?v=example123");
            videoContent.setTopic("Variables and Data Types");
            videoContent.setDifficulty("BEGINNER");
            videoContent.setScore(10);
            videoContent.setDuration(25);
            videoContent.setOrderIndex(1);
            videoContent.setPreview(true);
            videoContent = subContentRepository.save(videoContent);
            result.put("video_content_created", videoContent.getTitle());
            
            // 6. Create Questions for Video
            Question question1 = new Question();
            question1.setSubContentId(videoContent.getId());
            question1.setCourseId(course.getId());
            question1.setQuestionText("What is the default value of an int variable in Java?");
            question1.setQuestionType(Question.QuestionType.MULTIPLE_CHOICE);
            question1.setOptions(Arrays.asList("0", "null", "undefined", "1"));
            question1.setCorrectAnswer("0");
            question1.setExplanation("In Java, the default value of an int variable is 0");
            question1.setPoints(5);
            question1.setTimestamp(300); // 5:00 in video
            question1 = questionRepository.save(question1);
            
            Question question2 = new Question();
            question2.setSubContentId(videoContent.getId());
            question2.setCourseId(course.getId());
            question2.setQuestionText("Which of these is a reference type in Java?");
            question2.setQuestionType(Question.QuestionType.MULTIPLE_CHOICE);
            question2.setOptions(Arrays.asList("int", "float", "String", "boolean"));
            question2.setCorrectAnswer("String");
            question2.setExplanation("String is a reference type (class), while int, float, and boolean are primitive types");
            question2.setPoints(5);
            question2.setTimestamp(600); // 10:00 in video
            question2 = questionRepository.save(question2);
            
            result.put("questions_created", 2);
            
            // 7. Create Material (PDF)
            Material material = new Material();
            material.setSubContentId(videoContent.getId());
            material.setCourseId(course.getId());
            material.setTitle("Java Variables Cheat Sheet");
            material.setDescription("Quick reference guide for Java variables and data types");
            material.setMaterialType(Material.MaterialType.PDF);
            material.setUrl("https://drive.google.com/file/d/example-pdf-id/view");
            material.setFileName("java-variables-cheatsheet.pdf");
            material.setFileSize(2048000L);
            material = materialRepository.save(material);
            result.put("material_created", material.getTitle());
            
            // 8. Create Student and Enrollment
            User student = userRepository.findByEmail("student@test.com").orElse(null);
            if (student == null) {
                student = new User();
                student.setEmail("student@test.com");
                student.setFullName("Test Student");
                student.setRole("STUDENT");
                student.setPhone("9876543210");
                student.setPassword(passwordEncoder.encode("student123"));
                student.setEnabled(true);
                student = userRepository.save(student);
            }
            
            Enrollment enrollment = new Enrollment();
            enrollment.setUserId(student.getId());
            enrollment.setUserEmail(student.getEmail());
            enrollment.setCourseId(course.getId());
            enrollment.setStatus("ACTIVE");
            enrollment.setProgressPercentage(10);
            enrollment.setTotalScore(10);
            
            // Mark video as completed
            Map<String, Boolean> completedContents = new HashMap<>();
            completedContents.put(videoContent.getId(), true);
            enrollment.setCompletedContents(completedContents);
            
            enrollment = enrollmentRepository.save(enrollment);
            result.put("enrollment_created", "Student enrolled in course");
            
            // 9. Update course student count
            course.setEnrolledStudents(1);
            courseRepository.save(course);
            
            // Summary with IDs
            result.put("status", "SUCCESS");
            result.put("message", "✅ All collections created with proper mappings!");
            
            Map<String, String> ids = new HashMap<>();
            ids.put("subjectId", javaSubject.getId());
            ids.put("topicId_variables", variablesTopic.getId());
            ids.put("topicId_oop", oopTopic.getId());
            ids.put("courseId", course.getId());
            ids.put("subContentId", videoContent.getId());
            ids.put("question1Id", question1.getId());
            ids.put("question2Id", question2.getId());
            ids.put("materialId", material.getId());
            ids.put("enrollmentId", enrollment.getId());
            ids.put("instructorId", instructor.getId());
            ids.put("studentId", student.getId());
            result.put("generated_ids", ids);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "ERROR");
            error.put("message", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * View all collections and their relationships
     * GET http://localhost:8081/api/test/view-collections
     */
    @GetMapping("/view-collections")
    public ResponseEntity<?> viewCollections() {
        Map<String, Object> result = new HashMap<>();
        
        result.put("users", userRepository.count());
        result.put("subjects", subjectRepository.count());
        result.put("topics", topicRepository.count());
        result.put("courses", courseRepository.count());
        result.put("sub_contents", subContentRepository.count());
        result.put("questions", questionRepository.count());
        result.put("materials", materialRepository.count());
        result.put("enrollments", enrollmentRepository.count());
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Clear all test data
     * DELETE http://localhost:8081/api/test/clear-data
     */
    @DeleteMapping("/clear-data")
    public ResponseEntity<?> clearData() {
        questionRepository.deleteAll();
        materialRepository.deleteAll();
        subContentRepository.deleteAll();
        enrollmentRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();
        
        Map<String, String> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("message", "Test data cleared (courses and users preserved)");
        return ResponseEntity.ok(result);
    }
}
