const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SubcontentSchema = require('./subcontentModel');

const TopicSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  // Subcontent belongs to topics and contains only video/pdf/manual mcq
  subcontent: [SubcontentSchema],
  // aiQuiz is an array of ObjectId referencing AIQuiz documents stored at topic-level
  aiQuiz: [{ type: Schema.Types.ObjectId, ref: 'AIQuiz' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Topic', TopicSchema);
