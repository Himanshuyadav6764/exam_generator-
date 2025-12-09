# AI Quiz Service

This small Node.js + Express + MongoDB service implements topic-level AI-generated quizzes and student performance tracking as requested.

Key points implemented:

- Topic schema contains `subcontent` (video/pdf/manual MCQ) and an `aiQuiz` field (array of AIQuiz ObjectIds).
- Subcontent has `videoUrl`, `pdfUrl`, and `mcq` (manual MCQs).
- AIQuiz documents store `question`, `options` (array of 4 strings), `correctAnswer`, `explanation`, and `topicId`.
- StudentPerformance stores per-attempt details and stats.

APIs

- POST `/api/aiquiz/topic/:topicId/save` — Save AI quizzes for a topic. Body: `{ quizzes: [ {question, options, correctAnswer, explanation} ] }`.
- GET `/api/aiquiz/topic/:topicId` — Get AI quizzes for topic.
- POST `/api/aiquiz/publish/course` — Publish course; body `{ courseId, topicIds: [] }` responds with `aiQuizCount`.
- GET `/api/student/aiquiz/:topicId` — Student fetch AI quizzes for a topic.
- POST `/api/student/aiquiz/:topicId/submit` — Submit student answers and save performance. Body: `{ studentId, answers: [{questionId, selectedAnswer}], timeTakenSeconds }`.
- GET `/api/student/performance/:studentId/topic/:topicId` — Get topic-wise performance history for a student.

Run

1. Install dependencies: `npm install` in this folder.
2. Start MongoDB and set `MONGO_URI` env var if needed.
3. Run `npm start`.

Frontend integration notes

- The frontend should treat AI quizzes as a separate section at the topic level (not part of subcontent).
- When saving AI quizzes from the AI Quiz Generator, call the save endpoint to store them at topic-level.
