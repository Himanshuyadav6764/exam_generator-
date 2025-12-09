package com.authsystem.repository;

import com.authsystem.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends MongoRepository<Course, String> {
    List<Course> findByInstructorEmail(String instructorEmail);
    List<Course> findByStatus(String status);
    List<Course> findByDifficulty(String difficulty);
    List<Course> findBySubjectsContaining(String subject);
}
