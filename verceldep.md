# Vercel Deployment Guide for LMS

This guide explains how to deploy the Learning Management System on Vercel, including setup, configuration, and best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [What Can Be Deployed on Vercel](#what-can-be-deployed-on-vercel)
- [Prerequisites](#prerequisites)
- [Frontend Deployment](#frontend-deployment)
- [AI Quiz Service Deployment](#ai-quiz-service-deployment)
- [Backend Alternatives](#backend-alternatives)
- [Environment Variables](#environment-variables)
- [Custom Domain Setup](#custom-domain-setup)
- [Continuous Deployment](#continuous-deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Vercel is a cloud platform optimized for frontend frameworks and serverless functions. It provides:

- ⚡ Instant deployments with automatic HTTPS
- 🌍 Global CDN for fast content delivery
- 🔄 Automatic CI/CD with Git integration
- 📊 Built-in analytics and monitoring
- 🎨 Preview deployments for every push

## ✅ What Can Be Deployed on Vercel

| Component               | Can Deploy? | Method               | Notes                     |
| ----------------------- | ----------- | -------------------- | ------------------------- |
| **Angular Frontend**    | ✅ Yes      | Static Site          | Recommended - Perfect fit |
| **AI Quiz Service**     | ⚠️ Partial  | Serverless Functions | Requires adaptation       |
| **Spring Boot Backend** | ❌ No       | N/A                  | Use alternative hosting   |

### Recommended Architecture

```
┌─────────────────────────────────────────────────┐
│                    Users                         │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   Vercel CDN (Global)   │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Angular Frontend       │
        │  (Vercel Deployment)    │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────────────────┐
        │                                     │
   ┌────▼─────┐              ┌───────▼──────┐
   │ Backend  │              │  AI Quiz     │
   │ (Railway,│              │  Service     │
   │  Render, │              │  (Vercel     │
   │  Heroku) │              │  Functions)  │
   └────┬─────┘              └───────┬──────┘
        │                            │
        └──────────┬─────────────────┘
                   │
        ┌──────────▼──────────┐
        │   MongoDB Atlas      │
        │   (Database)         │
        └──────────────────────┘
```

## 📋 Prerequisites

1. **Vercel Account**

   - Sign up at [vercel.com](https://vercel.com)
   - Free tier includes 100GB bandwidth/month

2. **GitHub/GitLab/Bitbucket Account**

   - Repository connected to Vercel

3. **Required Services**
   - MongoDB Atlas (Database)
   - Cloudinary (Media Storage)
   - Groq API (AI Generation)
   - Backend hosting (Railway, Render, or Heroku)

## 🚀 Frontend Deployment

### Method 1: Deploy via Vercel Dashboard (Easiest)

#### Step 1: Prepare Your Frontend

```bash
cd frontend

# Ensure your package.json has the correct scripts
# Should include:
# "build": "ng build --configuration production"
```

#### Step 2: Create `vercel.json` Configuration

Create `frontend/vercel.json`:

```json
{
  "version": 2,
  "name": "lms-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/auth-frontend"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*\\.(js|css|json|ico|png|jpg|jpeg|svg|woff|woff2|ttf|eot))",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "regions": ["iad1"],
  "buildCommand": "npm run build",
  "outputDirectory": "dist/auth-frontend",
  "framework": "angular"
}
```

#### Step 3: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure project:
   - **Framework Preset:** Angular
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/auth-frontend`
5. Add environment variables (see Environment Variables section)
6. Click **"Deploy"**

#### Step 4: Verify Deployment

Your site will be live at: `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy Frontend

```bash
cd frontend

# First deployment (will ask configuration questions)
vercel

# Production deployment
vercel --prod
```

#### Step 4: Set Environment Variables

```bash
# Add environment variables
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_AI_SERVICE_URL production
```

### Update Angular Environment Files

Create `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://your-backend.railway.app/api",
  aiQuizServiceUrl: "https://your-vercel-domain.vercel.app/api/quiz",
};
```

## 🔧 AI Quiz Service Deployment (Serverless Functions)

Since Vercel supports Node.js serverless functions, you can adapt the AI Quiz Service.

### Step 1: Restructure for Serverless

Create `ai-quiz-service/vercel.json`:

```json
{
  "version": 2,
  "name": "lms-ai-quiz",
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Convert to Serverless Functions

Create `ai-quiz-service/api/` directory structure:

```
ai-quiz-service/
├── api/
│   ├── quiz/
│   │   ├── generate.js       # POST /api/quiz/generate
│   │   ├── save.js           # POST /api/quiz/save
│   │   └── [courseId].js     # GET /api/quiz/:courseId
│   └── performance/
│       ├── track.js          # POST /api/performance/track
│       └── get.js            # GET /api/performance/get
├── lib/
│   ├── db.js                 # MongoDB connection
│   ├── groq.js               # Groq API integration
│   └── utils.js              # Utility functions
├── vercel.json
└── package.json
```

### Step 3: Create Serverless Function Example

`ai-quiz-service/api/quiz/generate.js`:

```javascript
const { MongoClient } = require("mongodb");
const axios = require("axios");

// MongoDB connection (reuse connection)
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db("lms_database");
  cachedDb = db;
  return db;
}

// Serverless function handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { courseId, topicId, difficulty, numberOfQuestions } = req.body;

    // Connect to database
    const db = await connectToDatabase();

    // Generate quiz using Groq API
    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an expert quiz generator. Generate educational quiz questions.",
          },
          {
            role: "user",
            content: `Generate ${numberOfQuestions} multiple choice questions for topic ${topicId} at ${difficulty} difficulty level.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const quizData = JSON.parse(groqResponse.data.choices[0].message.content);

    // Save to database
    const quiz = await db.collection("ai_quiz").insertOne({
      courseId,
      topicId,
      questions: quizData.questions,
      difficulty,
      createdAt: new Date(),
      generatedBy: "AI",
    });

    res.status(200).json({
      success: true,
      quizId: quiz.insertedId,
      questions: quizData.questions,
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate quiz",
      message: error.message,
    });
  }
};
```

### Step 4: Deploy AI Quiz Service

```bash
cd ai-quiz-service

# Deploy to Vercel
vercel

# Production deployment
vercel --prod
```

## 🏗️ Backend Alternatives

Since Vercel doesn't support Java/Spring Boot, deploy your backend to:

### Option 1: Railway (Recommended)

**Pros:** Easy deployment, automatic scaling, affordable
**Pricing:** $5/month starter plan

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Deploy
railway up

# Add environment variables via Railway dashboard
```

**Railway Configuration:**

Create `backend/railway.json`:

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "mvn clean package -DskipTests"
  },
  "deploy": {
    "startCommand": "java -jar target/auth-system-1.0.0.jar",
    "healthcheckPath": "/actuator/health",
    "restartPolicyType": "on-failure"
  }
}
```

### Option 2: Render

**Pros:** Free tier available, easy to use
**Pricing:** Free tier (with limitations), $7/month for starter

1. Go to [render.com](https://render.com)
2. Connect your repository
3. Create a new **Web Service**
4. Configure:
   - **Environment:** Docker
   - **Build Command:** `mvn clean package`
   - **Start Command:** `java -jar target/auth-system-1.0.0.jar`
5. Add environment variables
6. Deploy

### Option 3: Heroku

**Pros:** Well-documented, many integrations
**Pricing:** $7/month hobby tier

```bash
# Install Heroku CLI
# Windows: Download from https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
cd backend
heroku create lms-backend

# Add Java buildpack
heroku buildpacks:set heroku/java

# Deploy
git push heroku main

# Set environment variables
heroku config:set SPRING_DATA_MONGODB_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-secret"
```

Create `backend/Procfile`:

```
web: java -Dserver.port=$PORT -jar target/auth-system-1.0.0.jar
```

Create `backend/system.properties`:

```
java.runtime.version=17
```

## 🔐 Environment Variables

### Frontend Environment Variables (Vercel)

Add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_AI_SERVICE_URL=https://your-ai-service.vercel.app/api
```

Or via CLI:

```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter the value when prompted
```

### AI Quiz Service Environment Variables (Vercel)

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms_database
GROQ_API_KEY=your-groq-api-key
NODE_ENV=production
```

### Backend Environment Variables (Railway/Render/Heroku)

```
SPRING_DATA_MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
OPENAI_API_KEY=your-groq-api-key
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

## 🌐 Custom Domain Setup

### Step 1: Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `www.yoursite.com`)
3. Follow DNS configuration instructions

### Step 2: Configure DNS

Add these records to your domain provider:

**For Apex Domain (yoursite.com):**

```
Type: A
Name: @
Value: 76.76.21.21
```

**For www Subdomain:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt.

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to your Git repository:

- **Production:** Pushes to `main` branch
- **Preview:** All other branches and pull requests

### Deployment Configuration

Create `.github/workflows/vercel-deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

### Branch Previews

Every push creates a unique preview URL:

```
https://lms-frontend-git-feature-branch.vercel.app
```

## 📊 Monitoring & Analytics

### Vercel Analytics

Enable in Project Settings → Analytics:

- Page views and unique visitors
- Top pages and referrers
- Device and browser statistics
- Core Web Vitals

### Vercel Logs

View real-time logs:

```bash
vercel logs
vercel logs --follow  # Stream logs
```

### Performance Monitoring

1. Go to Project → Analytics
2. View:
   - **Real Experience Score (RES)**
   - **Largest Contentful Paint (LCP)**
   - **First Input Delay (FID)**
   - **Cumulative Layout Shift (CLS)**

## 🎯 Optimization Tips

### 1. Enable Caching

Add cache headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Enable Compression

Vercel automatically enables Gzip and Brotli compression.

### 3. Image Optimization

Use Vercel's Image Optimization:

```typescript
// In Angular component
<img
  src="https://your-domain.vercel.app/_vercel/image?url=/path/to/image.jpg&w=800&q=75"
  alt="Optimized image"
/>
```

### 4. Bundle Size Optimization

```bash
# Analyze bundle size
cd frontend
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/auth-frontend/stats.json
```

## 🐛 Troubleshooting

### Issue: Build Fails on Vercel

**Solution:**

1. Check Node.js version in `package.json`:

```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

2. Clear Vercel cache:
   - Dashboard → Settings → General → Clear Cache

### Issue: API Calls Failing (CORS)

**Solution:**

Update backend CORS configuration:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "https://your-frontend.vercel.app",
                    "https://*.vercel.app"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowCredentials(true);
    }
}
```

### Issue: Environment Variables Not Working

**Solution:**

1. Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding variables
3. Check variable scope (Production/Preview/Development)

### Issue: 404 on Angular Routes

**Solution:**

Ensure `vercel.json` includes the catch-all route:

```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Issue: Serverless Function Timeout

**Solution:**

1. Optimize database queries
2. Add connection pooling
3. Upgrade to Pro plan (60s timeout vs 10s on Hobby)

## 💰 Cost Estimation

### Vercel Pricing

| Plan       | Price  | Bandwidth | Build Time  | Serverless Executions |
| ---------- | ------ | --------- | ----------- | --------------------- |
| Hobby      | Free   | 100 GB/mo | 6000 min/mo | 100 GB-Hrs            |
| Pro        | $20/mo | 1 TB/mo   | Unlimited   | 1000 GB-Hrs           |
| Enterprise | Custom | Custom    | Unlimited   | Unlimited             |

### Complete Stack Monthly Cost

| Service           | Tier    | Cost         |
| ----------------- | ------- | ------------ |
| Vercel (Frontend) | Hobby   | **Free**     |
| Railway (Backend) | Starter | **$5**       |
| MongoDB Atlas     | Shared  | **Free**     |
| Cloudinary        | Free    | **Free**     |
| Groq API          | Free    | **Free**     |
| **Total**         |         | **$5/month** |

### Scale-up Cost (Production)

| Service           | Tier | Cost           |
| ----------------- | ---- | -------------- |
| Vercel (Frontend) | Pro  | **$20**        |
| Railway (Backend) | Pro  | **$20**        |
| MongoDB Atlas     | M10  | **$60**        |
| Cloudinary        | Plus | **$99**        |
| Groq API          | Paid | **$10**        |
| **Total**         |      | **$209/month** |

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Angular Deployment Guide](https://angular.io/guide/deployment)

## 🚀 Quick Deploy Checklist

- [ ] Push code to GitHub repository
- [ ] Create Vercel account and link repository
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway/Render
- [ ] Configure MongoDB Atlas with IP whitelist
- [ ] Set up environment variables on all platforms
- [ ] Add custom domain (optional)
- [ ] Enable HTTPS/SSL (automatic)
- [ ] Test all API endpoints
- [ ] Monitor deployment logs
- [ ] Set up error tracking (Sentry)
- [ ] Enable analytics
- [ ] Configure backup strategy

## 🎉 Success!

Your LMS is now deployed on Vercel! 🚀

**Frontend URL:** `https://your-project.vercel.app`
**Backend URL:** `https://your-backend.railway.app`

---

**Need Help?** Open an issue or contact support@yourproject.com
