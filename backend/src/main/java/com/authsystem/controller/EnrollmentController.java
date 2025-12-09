package com.authsystem.controller;

import com.authsystem.model.Enrollment;
import com.authsystem.model.Course;
import com.authsystem.repository.EnrollmentRepository;
import com.authsystem.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/enrollment")
@CrossOrigin(origins = "*")
public class EnrollmentController {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @PostMapping("/enroll")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<?> enrollStudent(@RequestBody Enrollment enrollment) {
        try {
            Optional<Enrollment> existing = enrollmentRepository.findByUserIdAndCourseId(
                enrollment.getUserId(), enrollment.getCourseId());
            
            if (existing.isPresent()) {
                return ResponseEntity.badRequest().body("Already enrolled in this course");
            }

            enrollment.setEnrolledAt(LocalDateTime.now());
            enrollment.setStatus("ACTIVE");
            Enrollment saved = enrollmentRepository.save(enrollment);

            Optional<Course> courseOpt = courseRepository.findById(enrollment.getCourseId());
            if (courseOpt.isPresent()) {
                Course course = courseOpt.get();
                course.setEnrolledStudents(course.getEnrolledStudents() + 1);
                courseRepository.save(course);
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error enrolling: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<List<Enrollment>> getUserEnrollments(@PathVariable String userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(userId);
        return ResponseEntity.ok(enrollments);
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAuthority('INSTRUCTOR') or hasAuthority('ADMIN')")
    public ResponseEntity<List<Enrollment>> getCourseEnrollments(@PathVariable String courseId) {
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        return ResponseEntity.ok(enrollments);
    }

    @PatchMapping("/{id}/progress")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<?> updateProgress(@PathVariable String id, @RequestBody Enrollment progressData) {
        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(id);
        if (enrollmentOpt.isPresent()) {
            Enrollment enrollment = enrollmentOpt.get();
            enrollment.setProgressPercentage(progressData.getProgressPercentage());
            enrollment.setTotalScore(progressData.getTotalScore());
            enrollment.setCompletedContents(progressData.getCompletedContents());
            
            if (progressData.getProgressPercentage() >= 100) {
                enrollment.setStatus("COMPLETED");
            }
            
            enrollmentRepository.save(enrollment);
            return ResponseEntity.ok("Progress updated successfully");
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/unenroll/{id}")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<?> unenroll(@PathVariable String id) {
        try {
            Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(id);
            if (enrollmentOpt.isPresent()) {
                Enrollment enrollment = enrollmentOpt.get();
                
                Optional<Course> courseOpt = courseRepository.findById(enrollment.getCourseId());
                if (courseOpt.isPresent()) {
                    Course course = courseOpt.get();
                    course.setEnrolledStudents(Math.max(0, course.getEnrolledStudents() - 1));
                    courseRepository.save(course);
                }
                
                enrollmentRepository.deleteById(id);
                return ResponseEntity.ok("Unenrolled successfully");
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error unenrolling: " + e.getMessage());
        }
    }
}
