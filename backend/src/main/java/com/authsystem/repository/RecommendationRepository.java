package com.authsystem.repository;

import com.authsystem.model.Recommendation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends MongoRepository<Recommendation, String> {
    List<Recommendation> findByStudentEmailAndStatus(String studentEmail, String status);
    List<Recommendation> findByStudentEmailOrderByPriorityAsc(String studentEmail);
    List<Recommendation> findByStudentEmailAndStatusOrderByPriorityAsc(String studentEmail, String status);
}
