const AIQuiz = require('../models/aiQuizModel');
const AIQuizTest = require('../models/aiQuizTestModel');
const Topic = require('../models/topicModel');

// Generate AI quiz (mock generation for now - can integrate OpenAI later)
exports.generateQuiz = async (req, res) => {
  try {
    const { topic, numberOfQuestions } = req.body;
    
    if (!topic || !numberOfQuestions) {
      return res.status(400).json({ success: false, error: 'topic and numberOfQuestions are required' });
    }

    if (numberOfQuestions < 3 || numberOfQuestions > 50) {
      return res.status(400).json({ success: false, error: 'numberOfQuestions must be between 3 and 50' });
    }

    // Calculate duration: 1.5 minutes per question
    const duration = Math.ceil(numberOfQuestions * 1.5);

    // Define complete question-answer pairs to ensure correctness
    const questionBank = [
      {
        question: `What is the primary purpose of {topic}?`,
        options: ['To provide type safety and compile-time checking', 'To enable runtime polymorphism', 'To manage memory automatically', 'To support multiple inheritance'],
        correctOption: 0,
        explanation: 'The primary purpose is to provide type safety and compile-time checking, ensuring code reliability.'
      },
      {
        question: `Which of the following best describes {topic}?`,
        options: ['Object-oriented programming language', 'Procedural programming language', 'Functional programming language', 'Assembly language'],
        correctOption: 0,
        explanation: 'It is best described as an object-oriented programming language with modern features.'
      },
      {
        question: `In {topic}, what is the main advantage of using object-oriented programming?`,
        options: ['It allows code reusability and modularity', 'It increases code complexity', 'It reduces performance', 'It is only for beginners'],
        correctOption: 0,
        explanation: 'OOP allows code reusability and modularity, making development more efficient.'
      },
      {
        question: `What does the term 'polymorphism' mean in {topic}?`,
        options: ['Multiple forms of a single entity', 'A way to hide implementation details', 'A memory management technique', 'A debugging tool'],
        correctOption: 0,
        explanation: 'Polymorphism means multiple forms of a single entity, allowing flexibility in code.'
      },
      {
        question: `Which statement is true about {topic} variables?`,
        options: ['Variables must be declared with a type', 'Variables can change type at runtime', 'Variables are always global', 'Variables cannot be null'],
        correctOption: 0,
        explanation: 'Variables must be declared with a type, ensuring type safety.'
      },
      {
        question: `How does {topic} handle memory management?`,
        options: ['Automatic garbage collection', 'Manual memory allocation only', 'No memory management needed', 'Uses reference counting exclusively'],
        correctOption: 0,
        explanation: 'It uses automatic garbage collection to manage memory efficiently.'
      },
      {
        question: `What is the correct way to implement inheritance in {topic}?`,
        options: ['Using the extends keyword', 'Using the implements keyword', 'Using the inherits keyword', 'Using the super keyword alone'],
        correctOption: 0,
        explanation: 'Inheritance is implemented using the extends keyword for classes.'
      },
      {
        question: `Which of these is a valid {topic} data type?`,
        options: ['int, double, boolean, char', 'string, number, object', 'var, let, const', 'Integer, Float, Boolean'],
        correctOption: 0,
        explanation: 'Primitive data types include int, double, boolean, and char.'
      },
      {
        question: `In {topic}, what is the difference between '==' and 'equals()'?`,
        options: ['== compares references, equals() compares values', '== compares values, equals() compares references', 'They are identical', 'equals() is faster than =='],
        correctOption: 0,
        explanation: '== compares references while equals() compares actual values of objects.'
      },
      {
        question: `Which keyword is used for exception handling in {topic}?`,
        options: ['try-catch-finally', 'if-else-then', 'do-while-catch', 'exception-handler'],
        correctOption: 0,
        explanation: 'Exception handling uses try-catch-finally blocks to handle errors.'
      },
      {
        question: `What is the purpose of constructors in {topic}?`,
        options: ['To initialize objects with default values', 'To destroy objects', 'To compare objects', 'To clone objects'],
        correctOption: 0,
        explanation: 'Constructors are used to initialize objects with default or custom values.'
      },
      {
        question: `How do you create a loop in {topic}?`,
        options: ['Using for, while, or do-while loops', 'Using goto statements', 'Using jump commands', 'Loops are not supported'],
        correctOption: 0,
        explanation: 'Loops are created using for, while, or do-while constructs.'
      },
      {
        question: `What is encapsulation in {topic}?`,
        options: ['Bundling data and methods that operate on the data within a class', 'A way to create multiple objects', 'A sorting technique', 'A design pattern'],
        correctOption: 0,
        explanation: 'Encapsulation bundles data and methods together, hiding internal details.'
      },
      {
        question: `Which of the following is a {topic} framework?`,
        options: ['Spring, Hibernate, Struts', 'React, Angular, Vue', 'Express, Django, Flask', 'TensorFlow, PyTorch, Keras'],
        correctOption: 0,
        explanation: 'Popular frameworks include Spring, Hibernate, and Struts.'
      },
      {
        question: `What is the role of interfaces in {topic}?`,
        options: ['To define a contract for classes to implement', 'To store data permanently', 'To improve performance', 'To handle exceptions'],
        correctOption: 0,
        explanation: 'Interfaces define contracts that classes must implement.'
      },
      {
        question: `How does {topic} implement multithreading?`,
        options: ['Using Thread class or Runnable interface', 'Using async/await keywords', 'Using fork() system call', 'Multithreading is not supported'],
        correctOption: 0,
        explanation: 'Multithreading is implemented using Thread class or Runnable interface.'
      },
      {
        question: `What is the purpose of the 'static' keyword in {topic}?`,
        options: ['To create class-level members shared across all instances', 'To make methods faster', 'To hide implementation', 'To enable inheritance'],
        correctOption: 0,
        explanation: 'Static keyword creates class-level members shared by all instances.'
      },
      {
        question: `Which collection type is best for storing unique values in {topic}?`,
        options: ['HashSet or TreeSet', 'ArrayList', 'HashMap', 'LinkedList'],
        correctOption: 0,
        explanation: 'HashSet or TreeSet are used to store unique values without duplicates.'
      },
      {
        question: `What is the difference between abstract classes and interfaces in {topic}?`,
        options: ['Abstract classes can have implementation, interfaces cannot (before Java 8)', 'They are exactly the same', 'Interfaces can have constructors', 'Abstract classes cannot have abstract methods'],
        correctOption: 0,
        explanation: 'Abstract classes can have both abstract and concrete methods with state.'
      },
      {
        question: `Which access modifier provides the most restrictive access in {topic}?`,
        options: ['private', 'protected', 'public', 'default'],
        correctOption: 0,
        explanation: 'Private access modifier provides the most restrictive access, limiting visibility to the class itself.'
      },
      {
        question: `What is the purpose of garbage collection in {topic}?`,
        options: ['Automatic memory cleanup of unused objects', 'Manual deletion of files', 'Code optimization', 'Error handling'],
        correctOption: 0,
        explanation: 'Garbage collection automatically frees memory by removing unused objects.'
      },
      {
        question: `How do you implement a singleton pattern in {topic}?`,
        options: ['Using private constructor and static instance', 'Using public constructor only', 'Using multiple instances', 'Using abstract class'],
        correctOption: 0,
        explanation: 'Singleton pattern uses private constructor and static instance to ensure only one object exists.'
      },
      {
        question: `What is the difference between stack and heap memory in {topic}?`,
        options: ['Stack stores local variables, heap stores objects', 'Stack stores objects, heap stores variables', 'Both are the same', 'Neither is used'],
        correctOption: 0,
        explanation: 'Stack memory stores local variables and method calls, while heap stores objects.'
      },
      {
        question: `What is the purpose of the 'final' keyword in {topic}?`,
        options: ['To make variables constant, methods non-overridable, and classes non-inheritable', 'To delete variables', 'To make code faster', 'To handle errors'],
        correctOption: 0,
        explanation: 'Final keyword prevents modification of variables, overriding of methods, and inheritance of classes.'
      },
      {
        question: `What is the main benefit of using generics in {topic}?`,
        options: ['Type safety and code reusability', 'Faster execution', 'Less memory usage', 'Automatic error correction'],
        correctOption: 0,
        explanation: 'Generics provide type safety at compile time and enable code reusability.'
      }
    ];

    // Generate questions ensuring no duplicates
    const questions = [];
    const usedIndices = new Set();
    
    for (let i = 1; i <= numberOfQuestions; i++) {
      // Select a unique question from the bank
      let questionIndex = Math.floor(Math.random() * questionBank.length);
      while (usedIndices.has(questionIndex) && usedIndices.size < questionBank.length) {
        questionIndex = Math.floor(Math.random() * questionBank.length);
      }
      usedIndices.add(questionIndex);
      
      const selectedQ = questionBank[questionIndex];
      
      // Replace {topic} with actual topic name
      const questionText = selectedQ.question.replace(/{topic}/g, topic);
      const explanationText = selectedQ.explanation.replace(/{topic}/g, topic);
      
      questions.push({
        id: `q${i}`,
        type: 'mcq',
        question: questionText,
        options: [...selectedQ.options], // Create a copy of options
        correctOption: selectedQ.correctOption,
        explanation: explanationText,
        marks: 1
      });
    }

    // Return response in format expected by frontend with duration
    return res.json({
      success: true,
      quiz: {
        topic,
        totalQuestions: numberOfQuestions,
        duration: duration, // Duration in minutes (1.5x number of questions)
        questions
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to generate quiz' });
  }
};

// Save AI quiz (general endpoint for instructor - saves complete quiz)
exports.saveQuiz = async (req, res) => {
  try {
    const { courseId, topicName, title, description, duration, questions, published, createdBy } = req.body;

    if (!courseId || !topicName || !title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const quizTest = new AIQuizTest({
      courseId,
      topicName,
      title,
      description,
      duration: duration || Math.ceil(questions.length * 1.5),
      questions,
      published: published || false,
      createdBy: createdBy || 'system'
    });

    await quizTest.save();

    console.log(`✓ Quiz saved: ${title} (${questions.length} questions) for topic: ${topicName}`);

    return res.json({
      success: true,
      message: 'Quiz saved successfully',
      quiz: quizTest
    });
  } catch (err) {
    console.error('Error saving quiz:', err);
    return res.status(500).json({ success: false, error: 'Failed to save quiz' });
  }
};

// Get all AI quizzes for a course
exports.getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await AIQuizTest.find({ courseId }).sort({ createdAt: -1 }).lean();
    
    return res.json({
      success: true,
      count: quizzes.length,
      quizzes
    });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch quizzes' });
  }
};

// Save AI-generated quizzes for a topic (create or update). Expects array of quizzes in body
exports.saveAiQuizzesForTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const quizzes = req.body.quizzes; // array of { question, options[4], correctAnswer, explanation }
    if (!Array.isArray(quizzes)) return res.status(400).json({ error: 'quizzes must be an array' });

    const created = [];
    for (const q of quizzes) {
      const doc = new AIQuiz({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topicId
      });
      await doc.save();
      created.push(doc);
    }

    // attach to topic.aiQuiz (push ids)
    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    topic.aiQuiz = topic.aiQuiz.concat(created.map(c => c._id));
    await topic.save();

    return res.json({ ok: true, saved: created.length, quizzes: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all AI quizzes for topic
exports.getAiQuizzesForTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const quizzes = await AIQuiz.find({ topicId }).lean();
    return res.json({ ok: true, count: quizzes.length, quizzes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Publish course endpoint: returns ai quiz count for provided topics
exports.publishCourse = async (req, res) => {
  try {
    // expected body: { courseId, topicIds: [] }
    const { courseId, topicIds } = req.body;
    if (!Array.isArray(topicIds)) return res.status(400).json({ error: 'topicIds must be array' });

    let totalAI = 0;
    const topics = await Topic.find({ _id: { $in: topicIds } }).populate('aiQuiz');
    for (const t of topics) {
      totalAI += (t.aiQuiz || []).length;
    }

    // Publishing behaviour is domain-specific. Here, respond with counts and payload.
    return res.json({ ok: true, courseId, aiQuizCount: totalAI, publishedAt: new Date(), topics: topicIds });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
