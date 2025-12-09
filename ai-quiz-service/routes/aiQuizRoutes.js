const express = require('express');
const router = express.Router();
const aiQuizController = require('../controllers/aiQuizController');

// Generate AI quiz using OpenAI/AI
router.post('/generate', aiQuizController.generateQuiz);

// Save AI quiz (general endpoint for instructor)
router.post('/save', aiQuizController.saveQuiz);

// Save AI quizzes for a topic
router.post('/topic/:topicId/save', aiQuizController.saveAiQuizzesForTopic);

// Get all AI quizzes for topic
router.get('/topic/:topicId', aiQuizController.getAiQuizzesForTopic);

// Get AI quizzes for a course
router.get('/course/:courseId', aiQuizController.getQuizzesByCourse);

// Publish course with AI quiz count (body: { courseId, topicIds: [] })
router.post('/publish/course', aiQuizController.publishCourse);

module.exports = router;
