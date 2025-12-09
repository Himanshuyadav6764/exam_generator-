package com.authsystem.repository;

import com.authsystem.model.Material;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Material entity
 * Handles downloadable study materials (PDFs, documents, slides)
 */
@Repository
public interface MaterialRepository extends MongoRepository<Material, String> {
    
    /**
     * Find all materials for a specific sub-content
     */
    List<Material> findBySubContentId(String subContentId);
    
    /**
     * Find all materials for a specific course
     */
    List<Material> findByCourseId(String courseId);
    
    /**
     * Find materials by type for a sub-content
     */
    List<Material> findBySubContentIdAndMaterialType(String subContentId, Material.MaterialType materialType);
    
    /**
     * Find materials by type for a course
     */
    List<Material> findByCourseIdAndMaterialType(String courseId, Material.MaterialType materialType);
    
    /**
     * Count materials for a sub-content
     */
    long countBySubContentId(String subContentId);
    
    /**
     * Count materials for a course
     */
    long countByCourseId(String courseId);
    
    /**
     * Delete all materials for a sub-content
     * Cascade delete when content is removed
     */
    void deleteBySubContentId(String subContentId);
    
    /**
     * Delete all materials for a course
     * Cascade delete when course is removed
     */
    void deleteByCourseId(String courseId);
}
