package com.authsystem.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Service
public class OpenAIQuizService {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenAIQuizService.class);
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    
    @Value("${groq.api.key:}")
    private String groqApiKey;
    
    @Value("${openai.api.key:}")
    private String openaiApiKey;
    
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    public OpenAIQuizService() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Generate quiz using Groq API (faster and more cost-effective)
     */
    public String generateQuiz(String topic, int numberOfQuestions, String apiKeyOverride) throws IOException {
        // Use Groq API by default, fallback to OpenAI if Groq key not available
        String effectiveApiKey = (apiKeyOverride != null && !apiKeyOverride.isEmpty()) 
                ? apiKeyOverride 
                : (groqApiKey != null && !groqApiKey.isEmpty() ? groqApiKey : openaiApiKey);
        
        if (effectiveApiKey == null || effectiveApiKey.isEmpty()) {
            throw new IllegalArgumentException("API key is not configured. Please provide Groq or OpenAI API key.");
        }
        
        // Determine which API to use based on the key
        boolean useGroq = (apiKeyOverride == null || apiKeyOverride.isEmpty()) && 
                          (groqApiKey != null && !groqApiKey.isEmpty());
        
        logger.info("🤖 Generating quiz using {} - Topic: '{}', Questions: {}", 
                    useGroq ? "Groq" : "OpenAI", topic, numberOfQuestions);
        
        String prompt = buildQuizPrompt(topic, numberOfQuestions);
        
        return useGroq ? callGroqAPI(prompt, effectiveApiKey) : callOpenAIAPI(prompt, effectiveApiKey);
    }
    
    /**
     * Call Groq API for quiz generation
     */
    private String callGroqAPI(String prompt, String apiKey) throws IOException {
        
        // Build Groq API request using llama-3.3-70b-versatile model (latest production)
        String requestBody = String.format("""
            {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert quiz generator. Generate educational quizzes with clear, unambiguous questions. Return ONLY valid JSON without markdown formatting."
                    },
                    {
                        "role": "user",
                        "content": %s
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 3000
            }
            """, objectMapper.writeValueAsString(prompt));
        
        Request request = new Request.Builder()
                .url(GROQ_API_URL)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                .build();
        
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                logger.error("Groq API error: {} - {}", response.code(), errorBody);
                throw new IOException("Groq API error: " + response.code() + " - " + errorBody);
            }
            
            String responseBody = response.body().string();
            logger.debug("Groq API response received");
            
            return extractContentFromResponse(responseBody);
        } catch (IOException e) {
            logger.error("Error calling Groq API: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * Call OpenAI API for quiz generation (fallback)
     */
    private String callOpenAIAPI(String prompt, String apiKey) throws IOException {
        
        // Build OpenAI API request
        String requestBody = String.format("""
            {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert quiz generator. Generate educational quizzes with clear, unambiguous questions. Return ONLY valid JSON without markdown formatting."
                    },
                    {
                        "role": "user",
                        "content": %s
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 3000
            }
            """, objectMapper.writeValueAsString(prompt));
        
        Request request = new Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                .build();
        
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                logger.error("OpenAI API error: {} - {}", response.code(), errorBody);
                throw new IOException("OpenAI API error: " + response.code() + " - " + errorBody);
            }
            
            String responseBody = response.body().string();
            logger.debug("OpenAI API response received");
            
            return extractContentFromResponse(responseBody);
        } catch (IOException e) {
            logger.error("Error calling OpenAI API: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * Extract content from API response (works for both Groq and OpenAI)
     */
    private String extractContentFromResponse(String responseBody) throws IOException {
        JsonNode jsonResponse = objectMapper.readTree(responseBody);
        
        // Extract generated content
        String content = jsonResponse
                .path("choices")
                .get(0)
                .path("message")
                .path("content")
                .asText();
        
        // Clean up markdown code blocks if present
        content = content
                .replaceAll("```json\\s*", "")
                .replaceAll("```\\s*", "")
                .trim();
        
        int tokensUsed = jsonResponse.path("usage").path("total_tokens").asInt();
        logger.info("Quiz generated successfully");
        logger.info("Tokens used: {}", tokensUsed);
        
        return content;
    }
    
    /**
     * Build the prompt for API to generate quiz
     */
    private String buildQuizPrompt(String topic, int numberOfQuestions) {
        int mcqCount = (int) Math.ceil(numberOfQuestions * 0.6); // 60% MCQs
        int tfCount = (int) Math.ceil(numberOfQuestions * 0.25); // 25% True/False
        int shortCount = numberOfQuestions - mcqCount - tfCount; // Remaining as short answer
        
        return String.format("""
            Generate a comprehensive quiz about "%s" with exactly %d questions.
            
            Distribution:
            - %d Multiple Choice Questions with exactly 4 options each
            - %d True/False questions
            - %d Short Answer questions
            
            Return ONLY a valid JSON object with this EXACT structure:
            {
              "topic": "%s",
              "totalQuestions": %d,
              "questions": [
                {
                  "id": "q1",
                  "type": "mcq",
                  "question": "What is...?",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correctOption": 0,
                  "explanation": "Brief explanation of the answer",
                  "marks": 1
                },
                {
                  "id": "q2",
                  "type": "true-false",
                  "question": "Statement here?",
                  "correctAnswer": true,
                  "explanation": "Why this is true/false",
                  "marks": 1
                },
                {
                  "id": "q3",
                  "type": "short-answer",
                  "question": "Explain...",
                  "shortAnswer": "Expected answer here",
                  "keywords": ["keyword1", "keyword2"],
                  "marks": 2
                }
              ]
            }
            
            IMPORTANT RULES:
            1. correctOption must be 0-3 (0=first option, 1=second, 2=third, 3=fourth)
            2. All MCQs must have exactly 4 options
            3. Questions must be clear and unambiguous
            4. Provide helpful explanations
            5. Use proper difficulty distribution (easy, medium, hard)
            6. No markdown formatting in output
            7. Ensure all JSON is properly formatted
            """, 
            topic, numberOfQuestions, mcqCount, tfCount, shortCount, topic, numberOfQuestions);
    }
    
    /**
     * Validate generated quiz structure
     */
    public boolean validateQuizStructure(String quizJson) {
        try {
            JsonNode quiz = objectMapper.readTree(quizJson);
            
            if (!quiz.has("topic") || !quiz.has("questions")) {
                logger.warn("Quiz missing required fields");
                return false;
            }
            
            JsonNode questions = quiz.get("questions");
            if (!questions.isArray() || questions.size() == 0) {
                logger.warn("Quiz has no questions");
                return false;
            }
            
            // Validate each question
            for (JsonNode question : questions) {
                String type = question.path("type").asText();
                
                if (type.equals("mcq")) {
                    JsonNode options = question.get("options");
                    if (options == null || options.size() != 4) {
                        logger.warn("MCQ doesn't have 4 options");
                        return false;
                    }
                    
                    int correctOption = question.path("correctOption").asInt(-1);
                    if (correctOption < 0 || correctOption > 3) {
                        logger.warn("Invalid correctOption: {}", correctOption);
                        return false;
                    }
                }
            }
            
            logger.info("Quiz structure validated");
            return true;
            
        } catch (Exception e) {
            logger.error("Quiz validation failed", e);
            return false;
        }
    }
}
