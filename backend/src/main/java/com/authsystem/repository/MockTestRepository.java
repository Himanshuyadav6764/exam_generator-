package com.authsystem.repository;

import com.authsystem.model.MockTest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MockTestRepository extends MongoRepository<MockTest, String> {
    List<MockTest> findByCourseId(String courseId);
    List<MockTest> findByCourseIdAndDifficulty(String courseId, String difficulty);
    List<MockTest> findByCreatedBy(String createdBy);
    List<MockTest> findByCourseIdAndIsActive(String courseId, boolean isActive);
}
