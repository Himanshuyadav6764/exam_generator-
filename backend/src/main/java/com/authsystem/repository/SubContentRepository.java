package com.authsystem.repository;

import com.authsystem.model.SubContent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubContentRepository extends MongoRepository<SubContent, String> {
    List<SubContent> findByCourseId(String courseId);
    List<SubContent> findByCourseIdOrderByOrderIndexAsc(String courseId);
    List<SubContent> findByTopic(String topic);
    List<SubContent> findByDifficulty(String difficulty);
}
