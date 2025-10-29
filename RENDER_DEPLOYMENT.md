# How to Deploy on Render - Step by Step Guide

## What You Need Before Starting

1. Your code is already on GitHub: https://github.com/Himanshuyadav6764/infosys_springboot
2. A free Render account (sign up at https://render.com)
3. A free MongoDB Atlas account (sign up at https://mongodb.com/cloud/atlas)

## PART 1: Setup MongoDB Atlas (Your Cloud Database)

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or email
3. Choose FREE tier (M0 Sandbox)

### Step 2: Create Database Cluster

1. After login, click "Build a Database"
2. Choose "M0 FREE" tier
3. Select region closest to you (AWS, any region)
4. Cluster Name: keep default or name it "auth-cluster"
5. Click "Create Cluster" (takes 3-5 minutes)

### Step 3: Create Database User

1. Click "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: authuser
5. Password: Click "Autogenerate Secure Password" and SAVE IT
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### Step 4: Allow Network Access

1. Click "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere"
4. This adds 0.0.0.0/0 (needed for Render to connect)
5. Click "Confirm"

### Step 5: Get Connection String

1. Click "Database" in left sidebar
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Driver: Node.js (any driver works)
5. Copy the connection string (looks like this):
   ```
   mongodb+srv://authuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace <password> with the actual password you saved earlier
7. Add database name before the ? like this:
   ```
   mongodb+srv://authuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/auth_system?retryWrites=true&w=majority
   ```
8. SAVE THIS CONNECTION STRING - You'll need it for Render

## PART 2: Deploy Backend on Render

### Step 1: Create Render Account

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (easier for deployment)
4. Authorize Render to access your GitHub repositories

### Step 2: Create Web Service

1. From Render Dashboard, click "New +"
2. Select "Web Service"
3. Click "Connect account" if needed and authorize GitHub
4. Find and select your repository: "infosys_springboot"
5. Click "Connect"

### Step 3: Configure Backend Service

Fill in these settings:

**Basic Settings:**

- Name: `auth-backend` (or any name you want)
- Region: Choose closest to you (Oregon USA is good)
- Branch: `main`
- Root Directory: `backend`
- Runtime: `Docker`

**Build & Deploy:**

- Dockerfile Path: `./Dockerfile`

**Instance Type:**

- Select "Free" (enough for testing)

**Environment Variables:**
Click "Add Environment Variable" and add these one by one:

| Key          | Value                                                            |
| ------------ | ---------------------------------------------------------------- |
| MONGODB_URI  | Paste your MongoDB connection string from Part 1                 |
| JWT_SECRET   | YourSuperSecretKeyForJWTTokenGenerationMustBeLongEnough123456789 |
| PORT         | 8081                                                             |
| CORS_ORIGINS | http://localhost:4200 (we'll update this later)                  |

**Advanced Settings (Optional):**

- Health Check Path: `/api/health/mongodb`
- Auto-Deploy: Yes (automatically deploys when you push to GitHub)

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will start building your app (takes 5-10 minutes first time)
3. Watch the logs - you'll see:
   - Building Docker image
   - Running mvn clean package
   - Starting Spring Boot
   - "Started AuthApplication" means success!

### Step 5: Get Your Backend URL

1. Once deployed, you'll see a URL at the top like:
   ```
   https://auth-backend-xxxx.onrender.com
   ```
2. SAVE THIS URL - You'll need it for frontend
3. Test it by visiting:
   ```
   https://auth-backend-xxxx.onrender.com/api/health/mongodb
   ```
4. You should see: "status": "Connected"

## PART 3: Deploy Frontend on Render

### Step 1: Update Frontend Environment File

Before deploying frontend, you need to update it with your backend URL.

1. On your local machine, edit: `frontend/src/environments/environment.prod.ts`
2. Change apiUrl to your Render backend URL:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: "https://auth-backend-xxxx.onrender.com/api",
   };
   ```
3. Save the file
4. Commit and push:
   ```bash
   git add .
   git commit -m "Update frontend with Render backend URL"
   git push origin main
   ```

### Step 2: Create Static Site

1. From Render Dashboard, click "New +"
2. Select "Static Site"
3. Connect same repository: "infosys_springboot"
4. Click "Connect"

### Step 3: Configure Frontend Static Site

Fill in these settings:

**Basic Settings:**

- Name: `auth-frontend` (or any name you want)
- Branch: `main`
- Root Directory: `frontend`

**Build Settings:**

- Build Command: `npm install && npm run build --prod`
- Publish Directory: `dist/auth-system`

**Advanced (Optional):**

- Auto-Deploy: Yes

### Step 4: Deploy Frontend

1. Click "Create Static Site"
2. Render will build your Angular app (takes 5-8 minutes)
3. Watch logs for "Site is live"
4. Your frontend URL will be like:
   ```
   https://auth-frontend-xxxx.onrender.com
   ```

## PART 4: Final Configuration

### Step 1: Update CORS in Backend

1. Go back to your backend service in Render
2. Click "Environment" tab
3. Find CORS_ORIGINS variable
4. Update value to include your frontend URL:
   ```
   https://auth-frontend-xxxx.onrender.com,http://localhost:4200
   ```
5. Click "Save Changes"
6. Render will automatically redeploy backend

### Step 2: Test Your Deployed App

1. Open your frontend URL: `https://auth-frontend-xxxx.onrender.com`
2. You should see the login page
3. Click "Register" and create a new account:
   - Email: test@example.com
   - Password: Test123
   - Full Name: Test User
   - Role: STUDENT
   - Phone: 1234567890
4. Click Register - should show success
5. Login with your credentials
6. You should see the Student Dashboard

### Step 3: Verify in MongoDB Atlas

1. Go back to MongoDB Atlas
2. Click "Browse Collections"
3. Database: auth_system
4. Collection: users
5. You should see your registered user!

## PART 5: Important Notes

### Free Tier Limitations

- Backend "spins down" after 15 minutes of no activity
- First request after spin-down takes 30-60 seconds (cold start)
- This is normal for free tier - perfect for testing/development
- 750 hours/month free (one service can run 24/7)

### Keeping Service Active

If you want to prevent spin-down:

1. Use a service like UptimeRobot (free) to ping your backend every 10 minutes
2. Or upgrade to paid plan (no cold starts)

### Your Live URLs

After deployment, save these:

- Frontend: https://auth-frontend-xxxx.onrender.com
- Backend API: https://auth-backend-xxxx.onrender.com
- Database: MongoDB Atlas Cloud

### Postman Testing with Live Backend

Update your Postman collection:

1. Change base_url variable to: `https://auth-backend-xxxx.onrender.com`
2. All your tests will now work with the live backend!

## Troubleshooting

### Backend Won't Start

**Problem:** Build fails or app crashes
**Solution:**

1. Check logs in Render dashboard
2. Verify environment variables are set correctly
3. Test MongoDB connection string locally first
4. Make sure MongoDB Atlas IP whitelist includes 0.0.0.0/0

### Frontend Shows "Connection Refused"

**Problem:** Frontend can't reach backend
**Solution:**

1. Verify backend is running (check Render dashboard)
2. Check environment.prod.ts has correct backend URL
3. Verify CORS_ORIGINS includes your frontend URL
4. Wait 30-60 seconds if backend just woke up from sleep

### Database Connection Failed

**Problem:** Backend can't connect to MongoDB
**Solution:**

1. Verify MONGODB_URI environment variable is correct
2. Check password has no special characters (or URL-encode them)
3. Verify network access allows 0.0.0.0/0 in MongoDB Atlas
4. Test connection string with MongoDB Compass first

### 403 Forbidden Errors

**Problem:** Can't access protected endpoints
**Solution:**

1. Make sure you're logged in and have JWT token
2. Check token hasn't expired (24 hour expiry)
3. Verify you're using correct role for the endpoint

## Updating Your App

Whenever you make code changes:

1. Commit and push to GitHub:

   ```bash
   git add .
   git commit -m "Your change description"
   git push origin main
   ```

2. Render automatically deploys (if Auto-Deploy is on)

3. Watch logs in Render dashboard to see deployment progress

4. Changes go live in 5-10 minutes

## Cost Summary

- MongoDB Atlas M0: FREE (512 MB storage)
- Render Backend: FREE (750 hours/month)
- Render Frontend: FREE (100 GB bandwidth/month)
- Total Cost: $0.00

Perfect for development, testing, and portfolio projects!

## Next Steps After Deployment

1. Share your live URLs with others
2. Add to your portfolio/resume
3. Test with Postman using live backend
4. Monitor usage in Render dashboard
5. Check MongoDB Atlas for stored data

## Support & Documentation

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Spring Boot on Render: https://render.com/docs/deploy-spring-boot
- Your GitHub Repo: https://github.com/Himanshuyadav6764/infosys_springboot

## Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password saved
- [ ] Network access allows 0.0.0.0/0
- [ ] Connection string copied and updated
- [ ] Backend deployed on Render
- [ ] Backend health check returns "Connected"
- [ ] Frontend environment updated with backend URL
- [ ] Frontend deployed on Render
- [ ] CORS updated with frontend URL
- [ ] Test registration works
- [ ] Test login works
- [ ] Test role-based dashboards work
- [ ] User data visible in MongoDB Atlas

Congratulations! Your JWT authentication system is now live on the internet!
