const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Individual question schema
const QuestionSchema = new Schema({
  id: { type: String },
  type: { type: String, default: 'mcq' },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctOption: { type: Number, required: true },
  explanation: { type: String },
  marks: { type: Number, default: 1 }
}, { _id: false });

// AI Quiz Test Schema (complete quiz with metadata)
const AIQuizTestSchema = new Schema({
  courseId: { type: String, required: true },
  topicName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true }, // in minutes
  totalQuestions: { type: Number },
  questions: [QuestionSchema],
  published: { type: Boolean, default: false },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
AIQuizTestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.totalQuestions = this.questions.length;
  next();
});

module.exports = mongoose.model('AIQuizTest', AIQuizTestSchema);
