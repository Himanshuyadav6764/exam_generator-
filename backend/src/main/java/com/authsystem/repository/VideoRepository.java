package com.authsystem.repository;

import com.authsystem.model.Video;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * VideoRepository - Repository for Video entity
 * Provides query methods for filtering videos by topic, subject, and difficulty
 */
@Repository
public interface VideoRepository extends MongoRepository<Video, String> {
    
    // Find all videos for a specific topic
    List<Video> findByTopicId(String topicId);
    
    // Find all videos for a topic with specific difficulty
    List<Video> findByTopicIdAndDifficulty(String topicId, String difficulty);
    
    // Find all videos for a subject
    List<Video> findBySubjectId(String subjectId);
    
    // Find all videos for a subject with specific difficulty
    List<Video> findBySubjectIdAndDifficulty(String subjectId, String difficulty);
    
    // Find all videos by difficulty level (across all subjects)
    List<Video> findByDifficulty(String difficulty);
    
    // Find preview videos for a subject
    List<Video> findBySubjectIdAndIsPreview(String subjectId, Boolean isPreview);
    
    // Find all preview videos
    List<Video> findByIsPreview(Boolean isPreview);
    
    // Find videos ordered by orderIndex
    List<Video> findByTopicIdOrderByOrderIndexAsc(String topicId);
    
    // Find videos by topic and difficulty, ordered by index
    List<Video> findByTopicIdAndDifficultyOrderByOrderIndexAsc(String topicId, String difficulty);
    
    // Count videos for a topic
    Long countByTopicId(String topicId);
    
    // Count videos for a subject
    Long countBySubjectId(String subjectId);
    
    // Count preview videos for a topic
    Long countByTopicIdAndIsPreview(String topicId, Boolean isPreview);
}
