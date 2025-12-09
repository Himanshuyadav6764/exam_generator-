const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentPerformanceSchema = new Schema({
  studentId: { type: String, required: true },
  courseId: { type: String },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
  topicName: { type: String },
  quizType: { type: String, enum: ['normal', 'ai'], default: 'normal' },
  quizId: { type: String },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  wrongAnswers: { type: Number, required: true },
  attemptTime: { type: Date, default: Date.now },
  timeTakenSeconds: { type: Number },
  scorePercent: { type: Number },
  details: [
    {
      questionId: String,
      selectedAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean
    }
  ]
});

module.exports = mongoose.model('StudentPerformance', StudentPerformanceSchema);
