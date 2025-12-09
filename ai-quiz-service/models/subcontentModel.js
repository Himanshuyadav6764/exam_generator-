const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubcontentSchema = new Schema({
  title: { type: String },
  videoUrl: { type: String },
  pdfUrl: { type: String },
  // mcq here refers to manually created MCQs belonging to subcontent
  mcq: [
    {
      question: String,
      options: [String],
      correctAnswer: String,
      explanation: String
    }
  ]
});

module.exports = SubcontentSchema;
