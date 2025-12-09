package com.example.auth.repository;

import com.example.auth.model.Subject;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Subject entity
 * Handles main course categories
 */
@Repository
public interface SubjectRepository extends MongoRepository<Subject, String> {
    
    /**
     * Find subject by title (renamed from name)
     */
    Optional<Subject> findByTitle(String title);
    
    /**
     * Find all subjects by difficulty level
     */
    List<Subject> findByDifficulty(String difficulty);
    
    /**
     * Find subjects by instructor
     */
    List<Subject> findByInstructorEmail(String instructorEmail);
    
    /**
     * Find subjects by instructor and difficulty
     */
    List<Subject> findByInstructorEmailAndDifficulty(String instructorEmail, String difficulty);
    
    /**
     * Find subjects by status
     */
    List<Subject> findByStatus(String status);
    
    /**
     * Find subjects by difficulty and status
     */
    List<Subject> findByDifficultyAndStatus(String difficulty, String status);
    
    /**
     * Find all active subjects
     */
    List<Subject> findByActive(Boolean active);
    
    /**
     * Find subjects by category
     */
    List<Subject> findByCategory(String category);
    
    /**
     * Find active subjects by category and difficulty
     */
    List<Subject> findByCategoryAndDifficultyAndActive(String category, String difficulty, Boolean active);
    
    /**
     * Check if subject title exists
     */
    boolean existsByTitle(String title);
    
    /**
     * Count subjects by instructor
     */
    Long countByInstructorEmail(String instructorEmail);
    
    /**
     * Count published subjects
     */
    Long countByStatus(String status);
    
    // Deprecated methods (keep for backward compatibility)
    @Deprecated
    Optional<Subject> findByName(String name);
    @Deprecated
    boolean existsByName(String name);
}
