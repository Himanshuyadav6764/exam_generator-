package com.authsystem.repository;

import com.authsystem.model.Question;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Question entity
 * Handles quiz questions attached to course content
 */
@Repository
public interface QuestionRepository extends MongoRepository<Question, String> {
    
    /**
     * Find all questions for a specific sub-content
     * Useful for displaying quizzes for a video or document
     */
    List<Question> findBySubContentId(String subContentId);
    
    /**
     * Find all questions for a specific course
     * Useful for creating comprehensive course assessments
     */
    List<Question> findByCourseId(String courseId);
    
    /**
     * Find questions for a specific sub-content ordered by timestamp
     * Useful for showing questions at specific video timestamps
     */
    List<Question> findBySubContentIdOrderByTimestampAsc(String subContentId);
    
    /**
     * Find questions by type for a course
     * Example: Get all multiple choice questions
     */
    List<Question> findByCourseIdAndQuestionType(String courseId, Question.QuestionType questionType);
    
    /**
     * Count questions for a sub-content
     */
    long countBySubContentId(String subContentId);
    
    /**
     * Count questions for a course
     */
    long countByCourseId(String courseId);
    
    /**
     * Find questions at a specific timestamp range in a video
     * Useful for showing questions during video playback
     */
    @Query("{ 'subContentId': ?0, 'timestamp': { $gte: ?1, $lte: ?2 } }")
    List<Question> findBySubContentIdAndTimestampBetween(String subContentId, Integer startTime, Integer endTime);
    
    /**
     * Delete all questions for a sub-content
     * Cascade delete when content is removed
     */
    void deleteBySubContentId(String subContentId);
    
    /**
     * Delete all questions for a course
     * Cascade delete when course is removed
     */
    void deleteByCourseId(String courseId);
}
