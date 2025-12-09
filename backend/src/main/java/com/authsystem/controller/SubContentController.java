package com.authsystem.controller;

import com.authsystem.model.SubContent;
import com.authsystem.repository.SubContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/content")
@CrossOrigin(origins = "*")
public class SubContentController {

    @Autowired
    private SubContentRepository subContentRepository;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createSubContent(@RequestBody SubContent subContent) {
        try {
            subContent.setCreatedAt(LocalDateTime.now());
            subContent.setUpdatedAt(LocalDateTime.now());
            SubContent savedContent = subContentRepository.save(subContent);
            return ResponseEntity.ok(savedContent);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating content: " + e.getMessage());
        }
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<SubContent>> getContentByCourse(@PathVariable String courseId) {
        List<SubContent> contents = subContentRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        return ResponseEntity.ok(contents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getContentById(@PathVariable String id) {
        Optional<SubContent> content = subContentRepository.findById(id);
        if (content.isPresent()) {
            return ResponseEntity.ok(content.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/topic/{topic}")
    public ResponseEntity<List<SubContent>> getContentByTopic(@PathVariable String topic) {
        List<SubContent> contents = subContentRepository.findByTopic(topic);
        return ResponseEntity.ok(contents);
    }

    @GetMapping("/difficulty/{difficulty}")
    public ResponseEntity<List<SubContent>> getContentByDifficulty(@PathVariable String difficulty) {
        List<SubContent> contents = subContentRepository.findByDifficulty(difficulty);
        return ResponseEntity.ok(contents);
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> updateSubContent(@PathVariable String id, @RequestBody SubContent contentDetails) {
        Optional<SubContent> contentOptional = subContentRepository.findById(id);
        if (contentOptional.isPresent()) {
            SubContent content = contentOptional.get();
            content.setTitle(contentDetails.getTitle());
            content.setDescription(contentDetails.getDescription());
            content.setContentType(contentDetails.getContentType());
            content.setUrl(contentDetails.getUrl());
            content.setTopic(contentDetails.getTopic());
            content.setDifficulty(contentDetails.getDifficulty());
            content.setScore(contentDetails.getScore());
            content.setDuration(contentDetails.getDuration());
            content.setOrderIndex(contentDetails.getOrderIndex());
            content.setPreview(contentDetails.isPreview());
            content.setUpdatedAt(LocalDateTime.now());
            
            SubContent updatedContent = subContentRepository.save(content);
            return ResponseEntity.ok(updatedContent);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR') or hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteSubContent(@PathVariable String id) {
        try {
            subContentRepository.deleteById(id);
            return ResponseEntity.ok("Content deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting content: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<SubContent>> getAllContent() {
        List<SubContent> contents = subContentRepository.findAll();
        return ResponseEntity.ok(contents);
    }
}
