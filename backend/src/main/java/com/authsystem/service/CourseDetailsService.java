package com.authsystem.service;

import com.authsystem.dto.CourseDetailsDTO;
import com.authsystem.dto.CourseDetailsDTO.SubtopicDetailsDTO;
import com.authsystem.dto.CourseDetailsDTO.CourseContentCounts;
import com.authsystem.dto.CourseDetailsDTO.TopicContentCounts;
import com.authsystem.model.Course;
import com.authsystem.model.TopicSubcontent;
import com.authsystem.model.TopicWithSubcontents;
import com.authsystem.model.MCQ;
import com.authsystem.repository.CourseRepository;
import com.authsystem.repository.MCQRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseDetailsService {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private MCQRepository mcqRepository;
    
    /**
     * Get complete course details with all counts computed
     * This is used by both instructor and student panels
     */
    public CourseDetailsDTO getCourseDetailsWithCounts(String courseId) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        
        if (!courseOpt.isPresent()) {
            throw new RuntimeException("Course not found with ID: " + courseId);
        }
        
        Course course = courseOpt.get();
        CourseDetailsDTO dto = new CourseDetailsDTO();
        
        // Copy basic course info
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setInstructorName(course.getInstructorName());
        dto.setInstructorEmail(course.getInstructorEmail());
        dto.setDifficulty(course.getDifficulty());
        dto.setStatus(course.getStatus());
        dto.setThumbnail(course.getThumbnail());
        dto.setSubjects(course.getSubjects());
        dto.setEnrolledStudents(course.getEnrolledStudents());
        dto.setAverageRating(course.getAverageRating());
        dto.setCreatedAt(course.getCreatedAt());
        dto.setUpdatedAt(course.getUpdatedAt());
        dto.setTopics(course.getTopics());
        
        // Get MCQs for this course grouped by topic
        List<MCQ> allMcqs;
        try {
            allMcqs = mcqRepository.findByCourseId(courseId);
            System.out.println("  📝 Found " + allMcqs.size() + " MCQs for courseId: " + courseId);
            // Debug: Print MCQ details
            for (MCQ mcq : allMcqs) {
                System.out.println("    🔍 MCQ: ID=" + mcq.getId() + ", TopicName='" + mcq.getTopicName() + "', Question=" + 
                    (mcq.getQuestion() != null && mcq.getQuestion().length() > 30 ? mcq.getQuestion().substring(0, 30) + "..." : mcq.getQuestion()));
            }
        } catch (Exception e) {
            System.err.println("  ⚠️ Error fetching MCQs (possibly corrupted data): " + e.getMessage());
            allMcqs = new ArrayList<>(); // Use empty list if MCQ fetch fails
        }
        
        Map<String, List<MCQ>> mcqsByTopic = allMcqs.stream()
            .filter(mcq -> mcq.getTopicName() != null && !mcq.getTopicName().isEmpty()) // Filter out null/empty topic names
            .collect(Collectors.groupingBy(MCQ::getTopicName));
        
        System.out.println("  🗂️ MCQs grouped into " + mcqsByTopic.size() + " topics");
        
        // Transform topicSubcontents with counts
        Map<String, List<SubtopicDetailsDTO>> transformedSubcontents = new HashMap<>();
        Map<String, TopicContentCounts> topicBreakdown = new HashMap<>();
        
        int totalSubtopics = 0;
        int totalVideos = 0;
        int totalPdfs = 0;
        int totalMcqs = allMcqs.size();
        
        System.out.println("🔍 CourseDetailsService: Building details for course: " + course.getTitle());
        System.out.println("  📚 Topics array: " + (course.getTopics() != null ? course.getTopics().size() : 0) + " topics");
        System.out.println("  📦 TopicSubcontents map: " + (course.getTopicSubcontents() != null ? course.getTopicSubcontents().size() : 0) + " keys");
        
        if (course.getTopicSubcontents() != null) {
            System.out.println("  🔍 Processing topicSubcontents...");
            for (Map.Entry<String, List<TopicSubcontent>> entry : course.getTopicSubcontents().entrySet()) {
                String topicName = entry.getKey();
                List<TopicSubcontent> subcontents = entry.getValue();
                System.out.println("    📖 Topic: '" + topicName + "' has " + (subcontents != null ? subcontents.size() : 0) + " subcontents");
                
                List<SubtopicDetailsDTO> subtopicDTOs = new ArrayList<>();
                TopicContentCounts topicCounts = new TopicContentCounts();
                
                int topicVideos = 0;
                int topicPdfs = 0;
                int topicMcqs = mcqsByTopic.getOrDefault(topicName, Collections.emptyList()).size();
                
                if (subcontents != null) {
                    for (int i = 0; i < subcontents.size(); i++) {
                        TopicSubcontent subcontent = subcontents.get(i);
                        SubtopicDetailsDTO subDTO = new SubtopicDetailsDTO();
                        subDTO.setName(subcontent.getName());
                        subDTO.setDescription(subcontent.getDescription());
                        subDTO.setVideoUrls(subcontent.getVideoUrls());
                        subDTO.setVideoFileNames(subcontent.getVideoFileNames());
                        subDTO.setPdfUrls(subcontent.getPdfUrls());
                        subDTO.setPdfFileNames(subcontent.getPdfFileNames());
                        subDTO.setThumbnailUrl(subcontent.getThumbnailUrl());
                        
                        // Compute counts for this subtopic
                        int videoCount = (subcontent.getVideoUrls() != null) ? subcontent.getVideoUrls().size() : 0;
                        int pdfCount = (subcontent.getPdfUrls() != null) ? subcontent.getPdfUrls().size() : 0;
                        
                        System.out.println("      ├─ Subcontent: " + subcontent.getName() + " (Videos: " + videoCount + ", PDFs: " + pdfCount + ")");
                        
                        subDTO.setVideoCount(videoCount);
                        subDTO.setPdfCount(pdfCount);
                        // Set MCQ count for first subtopic (MCQs are at topic level)
                        subDTO.setMcqCount(i == 0 ? topicMcqs : 0);
                        
                        topicVideos += videoCount;
                        topicPdfs += pdfCount;
                        
                        subtopicDTOs.add(subDTO);
                    }
                }
                
                totalSubtopics += subtopicDTOs.size();
                totalVideos += topicVideos;
                totalPdfs += topicPdfs;
                
                System.out.println("    📊 Topic '" + topicName + "' totals: Subtopics=" + subtopicDTOs.size() + ", Videos=" + topicVideos + ", PDFs=" + topicPdfs + ", MCQs=" + topicMcqs);
                
                topicCounts.setSubtopicCount(subtopicDTOs.size());
                topicCounts.setVideoCount(topicVideos);
                topicCounts.setPdfCount(topicPdfs);
                topicCounts.setMcqCount(topicMcqs);
                
                transformedSubcontents.put(topicName, subtopicDTOs);
                topicBreakdown.put(topicName, topicCounts);
            }
        } else {
            System.out.println("  ⚠️ WARNING: course.getTopicSubcontents() is NULL!");
        }
        
        System.out.println("  📊 FINAL COUNTS: Topics=" + (course.getTopics() != null ? course.getTopics().size() : 0) + ", Subtopics=" + totalSubtopics + ", Videos=" + totalVideos + ", PDFs=" + totalPdfs + ", MCQs=" + totalMcqs);
        
        dto.setTopicSubcontents(transformedSubcontents);
        
        // Set overall counts
        CourseContentCounts counts = new CourseContentCounts();
        counts.setTotalTopics(course.getTopics() != null ? course.getTopics().size() : 0);
        counts.setTotalSubtopics(totalSubtopics);
        counts.setTotalVideos(totalVideos);
        counts.setTotalPdfs(totalPdfs);
        counts.setTotalMcqs(totalMcqs);
        counts.setTopicBreakdown(topicBreakdown);
        
        dto.setContentCounts(counts);
        
        System.out.println("📊 Course Details Computed:");
        System.out.println("  📚 Topics: " + counts.getTotalTopics());
        System.out.println("  📖 Subtopics: " + counts.getTotalSubtopics());
        System.out.println("  🎥 Videos: " + counts.getTotalVideos());
        System.out.println("  📄 PDFs: " + counts.getTotalPdfs());
        System.out.println("  ❓ MCQs: " + counts.getTotalMcqs());
        
        return dto;
    }
    
    /**
     * Get published courses for students with counts
     */
    public List<CourseDetailsDTO> getPublishedCoursesWithCounts() {
        List<Course> publishedCourses = courseRepository.findByStatus("PUBLISHED");
        List<CourseDetailsDTO> courseDTOs = new ArrayList<>();
        
        for (Course course : publishedCourses) {
            try {
                CourseDetailsDTO dto = getCourseDetailsWithCounts(course.getId());
                courseDTOs.add(dto);
            } catch (Exception e) {
                System.err.println("⚠️ Error processing course " + course.getId() + ": " + e.getMessage());
            }
        }
        
        return courseDTOs;
    }
    
    /**
     * Get instructor's courses with counts
     */
    public List<CourseDetailsDTO> getInstructorCoursesWithCounts(String instructorEmail) {
        List<Course> instructorCourses = courseRepository.findByInstructorEmail(instructorEmail);
        List<CourseDetailsDTO> courseDTOs = new ArrayList<>();
        
        for (Course course : instructorCourses) {
            try {
                CourseDetailsDTO dto = getCourseDetailsWithCounts(course.getId());
                courseDTOs.add(dto);
            } catch (Exception e) {
                System.err.println("⚠️ Error processing course " + course.getId() + ": " + e.getMessage());
            }
        }
        
        return courseDTOs;
    }
}
