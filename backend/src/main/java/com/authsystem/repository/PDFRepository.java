package com.authsystem.repository;

import com.authsystem.model.PDF;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * PDFRepository - Repository for PDF entity
 * Provides query methods for filtering PDFs by topic, subject, and difficulty
 */
@Repository
public interface PDFRepository extends MongoRepository<PDF, String> {
    
    // Find all PDFs for a specific topic
    List<PDF> findByTopicId(String topicId);
    
    // Find all PDFs for a topic with specific difficulty
    List<PDF> findByTopicIdAndDifficulty(String topicId, String difficulty);
    
    // Find all PDFs for a subject
    List<PDF> findBySubjectId(String subjectId);
    
    // Find all PDFs for a subject with specific difficulty
    List<PDF> findBySubjectIdAndDifficulty(String subjectId, String difficulty);
    
    // Find all PDFs by difficulty level (across all subjects)
    List<PDF> findByDifficulty(String difficulty);
    
    // Find downloadable PDFs for a topic
    List<PDF> findByTopicIdAndIsDownloadable(String topicId, Boolean isDownloadable);
    
    // Find all downloadable PDFs
    List<PDF> findByIsDownloadable(Boolean isDownloadable);
    
    // Find PDFs ordered by orderIndex
    List<PDF> findByTopicIdOrderByOrderIndexAsc(String topicId);
    
    // Find PDFs by topic and difficulty, ordered by index
    List<PDF> findByTopicIdAndDifficultyOrderByOrderIndexAsc(String topicId, String difficulty);
    
    // Count PDFs for a topic
    Long countByTopicId(String topicId);
    
    // Count PDFs for a subject
    Long countBySubjectId(String subjectId);
    
    // Count downloadable PDFs for a topic
    Long countByTopicIdAndIsDownloadable(String topicId, Boolean isDownloadable);
}
