const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AIQuizSchema = new Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIQuiz', AIQuizSchema);
