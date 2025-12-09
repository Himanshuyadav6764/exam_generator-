package com.authsystem.repository;

import com.authsystem.model.AIQuiz;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AIQuizRepository extends MongoRepository<AIQuiz, String> {
    List<AIQuiz> findByCourseId(String courseId);
    List<AIQuiz> findByCourseIdAndTopicName(String courseId, String topicName);
    List<AIQuiz> findByCreatedBy(String createdBy);
    List<AIQuiz> findByPublished(boolean published);
}
