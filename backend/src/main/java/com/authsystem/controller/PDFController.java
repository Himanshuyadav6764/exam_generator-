package com.authsystem.controller;

import com.authsystem.model.PDF;
import com.authsystem.model.Topic;
import com.authsystem.model.Subject;
import com.authsystem.repository.PDFRepository;
import com.authsystem.repository.TopicRepository;
import com.authsystem.repository.SubjectRepository;
import com.authsystem.service.impl.CloudinaryStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/**
 * PDFController - Handles PDF content CRUD operations
 * PDFs belong to topics and can have downloadable flags
 */
@RestController
@RequestMapping("/api/pdfs")
@CrossOrigin(origins = "*")
public class PDFController {

    @Autowired
    private PDFRepository pdfRepository;
    
    @Autowired
    private TopicRepository topicRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private CloudinaryStorageService cloudStorageService;

    /**
     * POST /api/pdfs/create
     * Create PDF without file upload (URL provided)
     */
    @PostMapping("/create")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> createPDF(@RequestBody PDF pdf) {
        try {
            // Validate required fields
            if (pdf.getTopicId() == null || pdf.getTopicId().isEmpty()) {
                return ResponseEntity.badRequest().body("Topic ID is required");
            }
            if (pdf.getTitle() == null || pdf.getTitle().isEmpty()) {
                return ResponseEntity.badRequest().body("PDF title is required");
            }
            if (pdf.getUrl() == null || pdf.getUrl().isEmpty()) {
                return ResponseEntity.badRequest().body("PDF URL is required");
            }
            
            // Verify topic exists and get its details
            Optional<Topic> topicOptional = topicRepository.findById(pdf.getTopicId());
            if (!topicOptional.isPresent()) {
                return ResponseEntity.badRequest().body("Topic not found");
            }
            
            Topic topic = topicOptional.get();
            
            // Set subjectId from topic
            pdf.setSubjectId(topic.getSubjectId());
            
            // If difficulty not provided, inherit from topic
            if (pdf.getDifficulty() == null || pdf.getDifficulty().isEmpty()) {
                pdf.setDifficulty(topic.getDifficulty());
            } else {
                // Validate difficulty matches topic
                if (!pdf.getDifficulty().equals(topic.getDifficulty())) {
                    return ResponseEntity.badRequest()
                        .body("PDF difficulty must match topic difficulty: " + topic.getDifficulty());
                }
            }
            
            // Set timestamps
            pdf.setCreatedAt(LocalDateTime.now());
            pdf.setUpdatedAt(LocalDateTime.now());
            
            // Set default values
            if (pdf.getIsDownloadable() == null) {
                pdf.setIsDownloadable(false);
            }
            if (pdf.getOrderIndex() == null) {
                Long count = pdfRepository.countByTopicId(pdf.getTopicId());
                pdf.setOrderIndex(count.intValue() + 1);
            }
            
            PDF savedPDF = pdfRepository.save(pdf);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedPDF);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating PDF: " + e.getMessage());
        }
    }

    /**
     * POST /api/pdfs/upload
     * Upload PDF file to Cloudinary and create PDF record
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> uploadPDF(
            @RequestParam("file") MultipartFile file,
            @RequestParam("topicId") String topicId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "pages", required = false) Integer pages,
            @RequestParam(value = "isDownloadable", defaultValue = "false") Boolean isDownloadable) {
        try {
            // Verify file is PDF
            String contentType = file.getContentType();
            if (contentType == null || !contentType.equals("application/pdf")) {
                return ResponseEntity.badRequest().body("File must be a PDF");
            }
            
            // Verify topic exists
            Optional<Topic> topicOptional = topicRepository.findById(topicId);
            if (!topicOptional.isPresent()) {
                return ResponseEntity.badRequest().body("Topic not found");
            }
            
            Topic topic = topicOptional.get();
            
            // Upload PDF to Cloudinary
            String pdfUrl = cloudStorageService.uploadFile(file, "pdfs");
            
            // Create PDF record
            PDF pdf = new PDF();
            pdf.setTopicId(topicId);
            pdf.setSubjectId(topic.getSubjectId());
            pdf.setTitle(title);
            pdf.setDescription(description);
            pdf.setUrl(pdfUrl);
            pdf.setDifficulty(topic.getDifficulty());
            pdf.setFileSize(file.getSize());
            pdf.setPages(pages);
            pdf.setIsDownloadable(isDownloadable);
            pdf.setCreatedAt(LocalDateTime.now());
            pdf.setUpdatedAt(LocalDateTime.now());
            
            Long count = pdfRepository.countByTopicId(topicId);
            pdf.setOrderIndex(count.intValue() + 1);
            
            PDF savedPDF = pdfRepository.save(pdf);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedPDF);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error uploading PDF: " + e.getMessage());
        }
    }

    /**
     * GET /api/pdfs/all
     * Get all PDFs
     */
    @GetMapping("/all")
    public ResponseEntity<List<PDF>> getAllPDFs() {
        try {
            List<PDF> pdfs = pdfRepository.findAll();
            return ResponseEntity.ok(pdfs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/pdfs/{id}
     * Get PDF by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPDFById(@PathVariable String id) {
        try {
            Optional<PDF> pdf = pdfRepository.findById(id);
            if (pdf.isPresent()) {
                return ResponseEntity.ok(pdf.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching PDF: " + e.getMessage());
        }
    }

    /**
     * GET /api/pdfs/topic/{topicId}
     * Get all PDFs for a topic
     */
    @GetMapping("/topic/{topicId}")
    public ResponseEntity<List<PDF>> getPDFsByTopic(@PathVariable String topicId) {
        try {
            List<PDF> pdfs = pdfRepository.findByTopicIdOrderByOrderIndexAsc(topicId);
            return ResponseEntity.ok(pdfs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/pdfs/topic/{topicId}/difficulty/{level}
     * Get PDFs by topic and difficulty
     */
    @GetMapping("/topic/{topicId}/difficulty/{level}")
    public ResponseEntity<List<PDF>> getPDFsByTopicAndDifficulty(
            @PathVariable String topicId,
            @PathVariable String level) {
        try {
            List<PDF> pdfs = pdfRepository.findByTopicIdAndDifficultyOrderByOrderIndexAsc(
                topicId, level.toUpperCase());
            return ResponseEntity.ok(pdfs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/pdfs/subject/{subjectId}
     * Get all PDFs for a subject
     */
    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<PDF>> getPDFsBySubject(@PathVariable String subjectId) {
        try {
            List<PDF> pdfs = pdfRepository.findBySubjectId(subjectId);
            return ResponseEntity.ok(pdfs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/pdfs/subject/{subjectId}/difficulty/{level}
     * Get PDFs by subject and difficulty
     */
    @GetMapping("/subject/{subjectId}/difficulty/{level}")
    public ResponseEntity<List<PDF>> getPDFsBySubjectAndDifficulty(
            @PathVariable String subjectId,
            @PathVariable String level) {
        try {
            List<PDF> pdfs = pdfRepository.findBySubjectIdAndDifficulty(
                subjectId, level.toUpperCase());
            return ResponseEntity.ok(pdfs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/pdfs/downloadable
     * Get all downloadable PDFs
     */
    @GetMapping("/downloadable")
    public ResponseEntity<List<PDF>> getDownloadablePDFs() {
        try {
            List<PDF> pdfs = pdfRepository.findByIsDownloadable(true);
            return ResponseEntity.ok(pdfs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/pdfs/difficulty/{level}
     * Get PDFs by difficulty level
     */
    @GetMapping("/difficulty/{level}")
    public ResponseEntity<List<PDF>> getPDFsByDifficulty(@PathVariable String level) {
        try {
            List<PDF> pdfs = pdfRepository.findByDifficulty(level.toUpperCase());
            return ResponseEntity.ok(pdfs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * PUT /api/pdfs/{id}
     * Update PDF
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> updatePDF(@PathVariable String id, @RequestBody PDF pdfDetails) {
        try {
            Optional<PDF> pdfOptional = pdfRepository.findById(id);
            if (!pdfOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            PDF pdf = pdfOptional.get();
            
            // Update fields
            if (pdfDetails.getTitle() != null) {
                pdf.setTitle(pdfDetails.getTitle());
            }
            if (pdfDetails.getDescription() != null) {
                pdf.setDescription(pdfDetails.getDescription());
            }
            if (pdfDetails.getUrl() != null) {
                pdf.setUrl(pdfDetails.getUrl());
            }
            if (pdfDetails.getPages() != null) {
                pdf.setPages(pdfDetails.getPages());
            }
            if (pdfDetails.getIsDownloadable() != null) {
                pdf.setIsDownloadable(pdfDetails.getIsDownloadable());
            }
            if (pdfDetails.getOrderIndex() != null) {
                pdf.setOrderIndex(pdfDetails.getOrderIndex());
            }
            
            pdf.setUpdatedAt(LocalDateTime.now());
            
            PDF updatedPDF = pdfRepository.save(pdf);
            return ResponseEntity.ok(updatedPDF);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating PDF: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/pdfs/{id}/downloadable
     * Toggle downloadable status
     */
    @PatchMapping("/{id}/downloadable")
    @PreAuthorize("hasAuthority('INSTRUCTOR')")
    public ResponseEntity<?> toggleDownloadable(
            @PathVariable String id,
            @RequestParam Boolean isDownloadable) {
        try {
            Optional<PDF> pdfOptional = pdfRepository.findById(id);
            if (!pdfOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            PDF pdf = pdfOptional.get();
            pdf.setIsDownloadable(isDownloadable);
            pdf.setUpdatedAt(LocalDateTime.now());
            
            PDF updatedPDF = pdfRepository.save(pdf);
            return ResponseEntity.ok(updatedPDF);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating downloadable status: " + e.getMessage());
        }
    }

    /**
     * DELETE /api/pdfs/{id}
     * Delete PDF
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('INSTRUCTOR') or hasAuthority('ADMIN')")
    public ResponseEntity<?> deletePDF(@PathVariable String id) {
        try {
            Optional<PDF> pdf = pdfRepository.findById(id);
            if (!pdf.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            pdfRepository.deleteById(id);
            return ResponseEntity.ok("PDF deleted successfully");
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting PDF: " + e.getMessage());
        }
    }

    /**
     * GET /api/pdfs/topic/{topicId}/stats
     * Get PDF statistics for a topic
     */
    @GetMapping("/topic/{topicId}/stats")
    public ResponseEntity<?> getTopicPDFStats(@PathVariable String topicId) {
        try {
            Long totalPDFs = pdfRepository.countByTopicId(topicId);
            Long downloadablePDFs = pdfRepository.countByTopicIdAndIsDownloadable(topicId, true);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalPDFs", totalPDFs);
            stats.put("downloadablePDFs", downloadablePDFs);
            stats.put("lockedPDFs", totalPDFs - downloadablePDFs);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching stats: " + e.getMessage());
        }
    }
}
