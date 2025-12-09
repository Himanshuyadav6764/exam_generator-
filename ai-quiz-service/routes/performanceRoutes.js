const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');

// Student fetch AI quizzes for topic
router.get('/aiquiz/:topicId', performanceController.fetchAiQuizzesForStudent);

// Submit quiz and save performance
router.post('/aiquiz/:topicId/submit', performanceController.submitQuizAndSavePerformance);

// Get topic-wise performance for student
router.get('/performance/:studentId/topic/:topicId', performanceController.getTopicPerformanceForStudent);

// Save AI quiz performance
router.post('/performance/ai-quiz', performanceController.saveAIQuizPerformance);

// Get student performance for a course (both AI and normal quizzes)
router.get('/performance/:studentId/course/:courseId', performanceController.getStudentCoursePerformance);

module.exports = router;
