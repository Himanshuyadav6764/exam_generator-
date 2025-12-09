package com.authsystem.repository;

import com.authsystem.model.StudentProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface StudentProgressRepository extends MongoRepository<StudentProgress, String> {
    Optional<StudentProgress> findByStudentEmailAndCourseId(String studentEmail, String courseId);
    List<StudentProgress> findByStudentEmail(String studentEmail);
    List<StudentProgress> findByCourseId(String courseId);
}
