const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ai_quiz_service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  seedData();
}).catch(err => {
  console.error('Connection error:', err);
});

// Define schemas
const AIQuizSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
  explanation: String,
  topicId: String,
  createdAt: { type: Date, default: Date.now }
});

const TopicSchema = new mongoose.Schema({
  title: String,
  description: String,
  subcontent: [],
  aiQuiz: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AIQuiz' }],
  createdAt: { type: Date, default: Date.now }
});

const AIQuiz = mongoose.model('AIQuiz', AIQuizSchema);
const Topic = mongoose.model('Topic', TopicSchema);

async function seedData() {
  try {
    // Clear existing data
    await AIQuiz.deleteMany({});
    await Topic.deleteMany({});
    
    // Create a test topic
    const topic = new Topic({
      title: 'Introduction to JavaScript',
      description: 'Learn the basics of JavaScript programming',
      subcontent: []
    });
    await topic.save();
    
    const topicId = 'introduction_to_javascript'; // This matches frontend topicId generation
    
    // Create AI quiz questions
    const questions = [
      {
        question: 'What is JavaScript primarily used for?',
        options: [
          'Database management',
          'Web development and interactivity',
          'Operating system development',
          'Hardware programming'
        ],
        correctAnswer: 'Web development and interactivity',
        explanation: 'JavaScript is a programming language primarily used for adding interactivity and dynamic behavior to web pages.',
        topicId: topicId
      },
      {
        question: 'Which of the following is the correct way to declare a variable in JavaScript?',
        options: [
          'variable x = 10;',
          'var x = 10;',
          'int x = 10;',
          'declare x = 10;'
        ],
        correctAnswer: 'var x = 10;',
        explanation: 'In JavaScript, variables are declared using var, let, or const keywords. "var x = 10;" is the traditional way.',
        topicId: topicId
      },
      {
        question: 'What does DOM stand for in JavaScript?',
        options: [
          'Data Object Model',
          'Document Object Model',
          'Digital Optimization Method',
          'Dynamic Output Management'
        ],
        correctAnswer: 'Document Object Model',
        explanation: 'DOM stands for Document Object Model. It represents the structure of HTML documents as a tree of objects that can be manipulated with JavaScript.',
        topicId: topicId
      },
      {
        question: 'Which symbol is used for single-line comments in JavaScript?',
        options: [
          '/* */',
          '//',
          '#',
          '--'
        ],
        correctAnswer: '//',
        explanation: 'In JavaScript, single-line comments start with //. Multi-line comments use /* */.',
        topicId: topicId
      },
      {
        question: 'What will console.log(typeof []); output?',
        options: [
          'array',
          'object',
          'list',
          'undefined'
        ],
        correctAnswer: 'object',
        explanation: 'In JavaScript, arrays are actually objects. The typeof operator returns "object" for arrays.',
        topicId: topicId
      }
    ];
    
    const savedQuizzes = [];
    for (const q of questions) {
      const quiz = new AIQuiz(q);
      await quiz.save();
      savedQuizzes.push(quiz._id);
    }
    
    // Update topic with quiz references
    topic.aiQuiz = savedQuizzes;
    await topic.save();
    
    console.log('✅ Sample data seeded successfully!');
    console.log(`   Created ${questions.length} AI quiz questions for topic: ${topicId}`);
    console.log('   You can now test the AI Quiz feature in the student panel.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}
