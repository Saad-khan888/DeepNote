# 🚀 DeepNote Deployment Guide

## Vercel Deployment (Recommended)

### Method 1: Vercel Dashboard (Easiest) ⭐

#### Step 1: Prepare Your Repository
✅ Already done! Your code is on GitHub.

#### Step 2: Sign Up/Login to Vercel
1. Go to: https://vercel.com/
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

#### Step 3: Import Your Project
1. Click **"Add New"** → **"Project"**
2. Find your repository: **"Saad-khan888/DeepNote"**
3. Click **"Import"**

#### Step 4: Configure Build Settings
Vercel should auto-detect Vite. Verify these settings:

```
Framework Preset: Vite
Root Directory: ./DeepNote (if your code is in a subdirectory)
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### Step 5: Add Environment Variables
Click on **"Environment Variables"** section and add each variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key | Production |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com | Production |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id | Production |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com | Production |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your-sender-id | Production |
| `VITE_FIREBASE_APP_ID` | your-app-id | Production |
| `VITE_GROQ_API_KEY` | Your Groq API key | Production |

**💡 Tip**: You can copy these from your local `.env` file!

#### Step 6: Deploy!
1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. 🎉 Your app is live!

#### Step 7: Get Your URL
- Production URL: `https://your-project-name.vercel.app`
- You can customize this domain in Vercel settings

---

### Method 2: Vercel CLI (Advanced)

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Login to Vercel
```bash
vercel login
```

#### Deploy from Command Line
```bash
cd "c:\Users\Super\Documents\fyp projects\DeepNote\DeepNote"
vercel
```

Follow the prompts:
1. Set up and deploy? **Yes**
2. Which scope? Select your account
3. Link to existing project? **No**
4. Project name? **deepnote** (or your preferred name)
5. Directory? **./** (current directory)
6. Override settings? **No**

#### Add Environment Variables via CLI
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_GROQ_API_KEY
```

For each command, paste the value when prompted.

#### Deploy to Production
```bash
vercel --prod
```

---

## 🔧 Post-Deployment Configuration

### 1. Update Firebase Authorized Domains
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **deepnote-f5651**
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your Vercel domain: `your-project-name.vercel.app`
6. Click **Add**

### 2. Test Your Deployment
Visit your deployed URL and test:
- ✅ Landing page loads
- ✅ Login with Google works
- ✅ Create a note
- ✅ AI assistant functions work
- ✅ Responsive design on mobile

### 3. Custom Domain (Optional)
1. In Vercel Dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Click **"Add"**
4. Enter your custom domain
5. Follow DNS configuration instructions

---

## 🔄 Continuous Deployment

**Good news!** Vercel automatically deploys when you push to GitHub:

1. Make changes locally
2. Commit: `git commit -m "Your changes"`
3. Push: `git push origin main`
4. Vercel automatically builds and deploys! 🎉

**Preview Deployments**: Every pull request gets its own preview URL for testing.

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Free)
1. Go to your project in Vercel
2. Click **"Analytics"** tab
3. Enable Web Analytics
4. See real-time traffic, performance, and usage

### View Deployment Logs
1. Go to **"Deployments"** tab
2. Click on any deployment
3. View build logs and runtime logs
4. Debug any issues

---

## ⚠️ Common Issues & Solutions

### Issue 1: Build Fails
**Error**: `Module not found` or `Dependencies missing`

**Solution**:
```bash
# Ensure package.json has all dependencies
npm install
npm run build  # Test build locally first
```

### Issue 2: Environment Variables Not Working
**Error**: API calls fail in production

**Solution**:
1. Verify all environment variables are added in Vercel
2. Variables must start with `VITE_` for Vite apps
3. Re-deploy after adding variables

### Issue 3: 404 on Page Refresh
**Error**: Page not found when refreshing on routes

**Solution**: 
Already handled by `vercel.json` configuration! All routes redirect to `index.html`.

### Issue 4: Firebase Auth Not Working
**Error**: `auth/unauthorized-domain`

**Solution**: 
Add your Vercel domain to Firebase Authorized domains (see Post-Deployment Configuration #1)

---

## 🎨 Environment-Specific Configurations

### Development
```bash
vercel dev  # Run Vercel dev server locally
```

### Staging
```bash
vercel  # Deploy to preview URL
```

### Production
```bash
vercel --prod  # Deploy to production
```

---

## 📈 Performance Optimization

### Already Optimized:
- ✅ Vite build optimizations
- ✅ Code splitting
- ✅ Asset optimization
- ✅ Vercel CDN distribution

### Optional Enhancements:
1. **Enable Vercel Speed Insights**: Free real-user monitoring
2. **Image Optimization**: Use Vercel Image Optimization for assets
3. **Edge Functions**: Move API calls to Vercel Edge Functions

---

## 🔒 Security Considerations

### Production Checklist:
- ✅ All environment variables secured in Vercel
- ✅ No secrets in code or git history
- ✅ Firebase security rules configured
- ✅ HTTPS enabled (automatic with Vercel)
- ⚠️ Rotate your API keys (they were briefly exposed)
- ⚠️ Enable Firebase App Check (optional, advanced)

---

## 💰 Vercel Pricing

**Hobby Plan (Free)**:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Analytics
- ✅ Perfect for personal projects

**Pro Plan ($20/month)**: For commercial projects with higher traffic

---

## 📞 Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Support](https://vercel.com/support)

---

## 🎯 Quick Commands Reference

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs [deployment-url]

# List all deployments
vercel ls

# Remove a deployment
vercel remove [deployment-id]
```

---

<div align="center">
  
🚀 **Happy Deploying!** 🚀

Your DeepNote app will be live in minutes!

</div>
