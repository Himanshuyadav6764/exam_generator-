const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const aiQuizRoutes = require('./routes/aiQuizRoutes');
const performanceRoutes = require('./routes/performanceRoutes');

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(bodyParser.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_quiz_service';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error', err));

app.use('/api/aiquiz', aiQuizRoutes);
app.use('/api/student', performanceRoutes);

app.get('/', (req, res) => res.json({ ok: true, msg: 'AI Quiz Service running' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`AI Quiz Service listening on ${PORT}`));
