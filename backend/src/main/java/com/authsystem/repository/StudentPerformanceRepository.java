package com.authsystem.repository;

import com.authsystem.model.StudentPerformance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentPerformanceRepository extends MongoRepository<StudentPerformance, String> {
    
    Optional<StudentPerformance> findByStudentEmailAndCourseId(String studentEmail, String courseId);
    
    List<StudentPerformance> findByStudentEmail(String studentEmail);
    
    List<StudentPerformance> findByCourseId(String courseId);
    
    void deleteByStudentEmailAndCourseId(String studentEmail, String courseId);
}
