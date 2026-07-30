# 🔐 Security Guide for DeepNote

## ✅ Security Fixes Applied

All hardcoded API keys have been removed and moved to environment variables.

---

## 📋 Current Status

### ✅ Secured:
- ✅ Firebase API keys moved to `.env`
- ✅ Groq API key moved to `.env`
- ✅ `.env` added to `.gitignore`
- ✅ `.env.example` created as template
- ✅ All sensitive keys now use environment variables

---

## 🚨 IMPORTANT: Before Pushing to GitHub

### 1. **Rotate Your Exposed Keys**

Since your keys were previously hardcoded in the repository, they may have been exposed. **Immediately rotate these keys:**

#### Firebase API Key:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `deepnote-f5651`
3. Go to **Project Settings** → **General**
4. Under **Your apps**, find your web app
5. Click **Delete app** and recreate it to get new credentials
6. Update your `.env` file with new keys

#### Groq API Key:
1. Go to [Groq Console](https://console.groq.com/)
2. Navigate to **API Keys**
3. Delete your old exposed key
4. Generate a new API key
5. Update your `.env` file with the new key

---

## 📝 Setup Instructions for New Developers

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/deepnote.git
cd deepnote/DeepNote
```

### 2. Create `.env` file
```bash
cp .env.example .env
```

### 3. Add your API keys to `.env`
Open `.env` and replace placeholder values with your actual keys:
```env
VITE_FIREBASE_API_KEY=your_actual_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_actual_domain_here
# ... etc
```

### 4. Install dependencies and run
```bash
npm install
npm run dev
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep `.env` in `.gitignore`
- ✅ Use environment variables for all secrets
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/staging/production
- ✅ Enable Firebase Security Rules
- ✅ Implement rate limiting on API endpoints
- ✅ Review commits before pushing

### ❌ DON'T:
- ❌ Commit `.env` file to git
- ❌ Hardcode API keys in source code
- ❌ Share API keys in chat/email
- ❌ Use production keys in development
- ❌ Expose keys in client-side code (use backend proxy for sensitive operations)

---

## 🛡️ Firebase Security Rules

Ensure your Firestore has proper security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notes - only owner can access
    match /notes/{noteId} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                    request.auth.uid == request.resource.data.userId;
    }
    
    // Folders - only owner can access
    match /folders/{folderId} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                    request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## 🔍 How to Check for Exposed Keys

### 1. Search Git History
```bash
git log --all --full-history --source --all -- "*firebase.js" "*aiService.js"
```

### 2. Check GitHub Repository
If you already pushed code with exposed keys:
1. Rotate all keys immediately
2. Use tools like [GitHub Secret Scanner](https://docs.github.com/en/code-security/secret-scanning)
3. Consider using [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to remove sensitive data from history

---

## 📞 Reporting Security Issues

If you discover a security vulnerability, please email: your-email@example.com

**DO NOT** open a public GitHub issue for security vulnerabilities.

---

## 🔄 Regular Security Maintenance

- [ ] Rotate API keys every 90 days
- [ ] Review Firebase Security Rules monthly
- [ ] Update dependencies regularly: `npm audit`
- [ ] Check for exposed secrets: `git secrets --scan`
- [ ] Monitor Firebase usage for unusual activity
- [ ] Enable 2FA on Firebase Console and Groq Console

---

## 📚 Additional Resources

- [Firebase Security Checklist](https://firebase.google.com/docs/rules/basics)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [API Key Security Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

<div align="center">
  
🔒 **Security is everyone's responsibility** 🔒

</div>
