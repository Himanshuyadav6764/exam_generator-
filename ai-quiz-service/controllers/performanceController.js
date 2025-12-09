const StudentPerformance = require('../models/studentPerformanceModel');
const AIQuiz = require('../models/aiQuizModel');

// Student fetch AI quizzes (same as aiQuiz route but kept for student flow)
exports.fetchAiQuizzesForStudent = async (req, res) => {
  try {
    const { topicId } = req.params;
    const quizzes = await AIQuiz.find({ topicId }).lean();
    return res.json({ ok: true, count: quizzes.length, quizzes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit quiz and save performance
exports.submitQuizAndSavePerformance = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { studentId, answers, timeTakenSeconds } = req.body;
    // answers: [{ questionId, selectedAnswer }]
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers must be array' });
    if (!studentId) return res.status(400).json({ error: 'studentId required' });

    // Load all question ids to validate
    const questionIds = answers.map(a => a.questionId);
    const quizzes = await AIQuiz.find({ _id: { $in: questionIds } });
    const quizMap = {};
    quizzes.forEach(q => { quizMap[q._id] = q; });

    let correct = 0;
    const details = [];
    for (const a of answers) {
      const q = quizMap[a.questionId];
      const isCorrect = q && q.correctAnswer === a.selectedAnswer;
      if (isCorrect) correct++;
      details.push({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: q ? q.correctAnswer : null,
        isCorrect: !!isCorrect
      });
    }

    const total = answers.length;
    const wrong = total - correct;
    const scorePercent = total === 0 ? 0 : Math.round((correct / total) * 100);

    const perf = new StudentPerformance({
      studentId,
      topicId,
      totalQuestions: total,
      correctAnswers: correct,
      wrongAnswers: wrong,
      timeTakenSeconds,
      scorePercent,
      details
    });
    await perf.save();

    return res.json({ ok: true, performanceId: perf._id, total, correct, wrong, scorePercent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get topic-wise performance (history) for a student
exports.getTopicPerformanceForStudent = async (req, res) => {
  try {
    const { studentId, topicId } = req.params;
    const records = await StudentPerformance.find({ studentId, topicId }).sort({ attemptTime: -1 }).lean();
    const last = records[0] || null;
    let best = null;
    if (records.length) {
      best = records.reduce((b, r) => (b == null || r.scorePercent > b.scorePercent ? r : b), null);
    }
    return res.json({ ok: true, totalAttempts: records.length, last, best, records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Save AI quiz performance
exports.saveAIQuizPerformance = async (req, res) => {
  try {
    const { studentId, courseId, topicName, quizId, totalQuestions, correctAnswers, wrongAnswers, timeTakenSeconds, scorePercent, details } = req.body;

    if (!studentId || !courseId || !topicName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const performance = new StudentPerformance({
      studentId,
      courseId,
      topicName,
      quizType: 'ai',
      quizId,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      timeTakenSeconds,
      scorePercent,
      details: details || []
    });

    await performance.save();
    console.log(`✓ AI Quiz performance saved for student ${studentId}: ${correctAnswers}/${totalQuestions} (${scorePercent}%)`);

    return res.json({
      success: true,
      message: 'Performance saved successfully',
      performance
    });
  } catch (err) {
    console.error('Error saving AI quiz performance:', err);
    return res.status(500).json({ success: false, error: 'Failed to save performance' });
  }
};

// Get student performance for a course (both AI and normal quizzes)
exports.getStudentCoursePerformance = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    
    // Get all performance records for this student and course
    const allRecords = await StudentPerformance.find({ studentId, courseId }).sort({ attemptTime: -1 }).lean();
    
    // Separate AI and normal quiz records
    const aiQuizRecords = allRecords.filter(r => r.quizType === 'ai');
    const normalQuizRecords = allRecords.filter(r => r.quizType === 'normal');
    
    // Calculate stats for AI quizzes
    const aiQuizStats = {
      totalAttempts: aiQuizRecords.length,
      averageScore: aiQuizRecords.length > 0 ? Math.round(aiQuizRecords.reduce((sum, r) => sum + r.scorePercent, 0) / aiQuizRecords.length) : 0,
      totalTimeSpent: aiQuizRecords.reduce((sum, r) => sum + (r.timeTakenSeconds || 0), 0),
      records: aiQuizRecords
    };
    
    // Calculate stats for normal quizzes
    const normalQuizStats = {
      totalAttempts: normalQuizRecords.length,
      averageScore: normalQuizRecords.length > 0 ? Math.round(normalQuizRecords.reduce((sum, r) => sum + r.scorePercent, 0) / normalQuizRecords.length) : 0,
      totalTimeSpent: normalQuizRecords.reduce((sum, r) => sum + (r.timeTakenSeconds || 0), 0),
      records: normalQuizRecords
    };
    
    // Overall stats
    const overallStats = {
      totalQuizzes: allRecords.length,
      averageScore: allRecords.length > 0 ? Math.round(allRecords.reduce((sum, r) => sum + r.scorePercent, 0) / allRecords.length) : 0,
      totalTimeSpent: allRecords.reduce((sum, r) => sum + (r.timeTakenSeconds || 0), 0)
    };
    
    return res.json({
      success: true,
      overall: overallStats,
      aiQuizzes: aiQuizStats,
      normalQuizzes: normalQuizStats
    });
  } catch (err) {
    console.error('Error fetching course performance:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch performance' });
  }
};
