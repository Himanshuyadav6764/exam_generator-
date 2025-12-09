package com.authsystem.repository;

import com.authsystem.model.MCQ;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * MCQRepository - Repository for MCQ entity
 * Provides query methods for filtering MCQs by topic, subject, and difficulty
 */
@Repository
public interface MCQRepository extends MongoRepository<MCQ, String> {
    
    // Find by course
    List<MCQ> findByCourseId(String courseId);
    List<MCQ> findByCourseIdAndTopicName(String courseId, String topicName);
    
    // New methods using topicId
    List<MCQ> findByTopicId(String topicId);
    List<MCQ> findByTopicIdAndDifficulty(String topicId, String difficulty);
    
    // New methods using subjectId
    List<MCQ> findBySubjectId(String subjectId);
    List<MCQ> findBySubjectIdAndDifficulty(String subjectId, String difficulty);
    
    // Find by difficulty (across all subjects)
    List<MCQ> findByDifficulty(String difficulty);
    
    // Find by creator
    List<MCQ> findByCreatedBy(String createdBy);
    
    // Find by topic name (denormalized field)
    List<MCQ> findByTopicIdAndTopicName(String topicId, String topicName);
    
    // Delete operations
    void deleteByTopicId(String topicId);
    void deleteBySubjectId(String subjectId);
    
    // Count operations
    Long countByTopicId(String topicId);
    Long countBySubjectId(String subjectId);
    Long countByTopicIdAndDifficulty(String topicId, String difficulty);
}
