package com.authsystem.repository;

import com.authsystem.model.QuizAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QuizAttemptRepository extends MongoRepository<QuizAttempt, String> {
    List<QuizAttempt> findByStudentEmail(String studentEmail);
    List<QuizAttempt> findByStudentEmailAndCourseId(String studentEmail, String courseId);
    List<QuizAttempt> findByStudentEmailAndTopicName(String studentEmail, String topicName);
    List<QuizAttempt> findByStudentEmailOrderByAttemptedAtDesc(String studentEmail);
    List<QuizAttempt> findTop5ByStudentEmailOrderByAttemptedAtDesc(String studentEmail);
}
