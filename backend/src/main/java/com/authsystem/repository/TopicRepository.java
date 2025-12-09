package com.authsystem.repository;

import com.authsystem.model.Topic;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Topic entity
 * Handles specific topics within subjects
 */
@Repository
public interface TopicRepository extends MongoRepository<Topic, String> {
    
    /**
     * Find all topics for a specific subject
     */
    List<Topic> findBySubjectId(String subjectId);
    
    /**
     * Find topics by subject and ordered by orderIndex
     */
    List<Topic> findBySubjectIdOrderByOrderIndexAsc(String subjectId);
    
    /**
     * Find active topics for a subject
     */
    List<Topic> findBySubjectIdAndActive(String subjectId, boolean active);
    
    /**
     * Find topics by name
     */
    List<Topic> findByName(String name);
    
    /**
     * Find topics by difficulty level
     */
    List<Topic> findByDifficulty(String difficulty);
    
    /**
     * Find topics by subject and difficulty
     */
    List<Topic> findBySubjectIdAndDifficulty(String subjectId, String difficulty);
    
    /**
     * Find topics by subject and difficulty, ordered by orderIndex
     */
    List<Topic> findBySubjectIdAndDifficultyOrderByOrderIndexAsc(String subjectId, String difficulty);
    
    /**
     * Find active topics by subject and difficulty
     */
    List<Topic> findBySubjectIdAndDifficultyAndActive(String subjectId, String difficulty, boolean active);
    
    /**
     * Count topics for a subject
     */
    Long countBySubjectId(String subjectId);
    
    /**
     * Count topics for a subject by difficulty
     */
    Long countBySubjectIdAndDifficulty(String subjectId, String difficulty);
    
    /**
     * Delete all topics for a subject
     * Cascade delete when subject is removed
     */
    void deleteBySubjectId(String subjectId);
}
