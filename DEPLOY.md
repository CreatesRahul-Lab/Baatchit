# 🚀 Quick Deploy Guide - Baatein Chat

## Prerequisites
- ✅ MongoDB Atlas account (free tier)
- ✅ Google OAuth credentials
- ✅ Vercel account (free tier)

---

## 🏃‍♂️ Quick Start (5 Minutes)

### 1. Test Locally
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### 2. Build for Production
```bash
npm run build
```

If build succeeds → You're ready to deploy! ✅

---

## 📦 Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel auto-detects Next.js ✅
5. Add environment variables (see below)
6. Click "Deploy"

---

## 🔐 Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```bash
MONGODB_URL=mongodb+srv://baatchit:NHx1j8BLOHrWyLjR@cluster0.utzg3y1.mongodb.net/
DB_NAME=baatein-chat
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=bfa34e1d5b7e4a23a0c1f8d9e6b2c7d54f92a17b63e8c4d1a5b0973e2c6d8f41
GOOGLE_CLIENT_ID=500084259755-o660l41orall3hlvto1e7h5v7s65doeh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**Important:** Replace `NEXTAUTH_URL` with your actual Vercel URL after deployment!

---

## 🔧 Update Google OAuth (After Deployment)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins:**
   ```
   https://your-app.vercel.app
   ```
4. Add to **Authorized redirect URIs:**
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
5. Save changes

---

## ✅ Post-Deployment Checklist

- [ ] App loads without errors
- [ ] Can sign in with Google
- [ ] Can create/join rooms
- [ ] Can send messages
- [ ] Can see other users
- [ ] Typing indicators work
- [ ] Join/leave notifications appear
- [ ] Reactions work

---

## 🐛 Common Issues & Fixes

### "Connection Failed" Error
- Check MongoDB connection string
- Verify environment variables in Vercel
- Check Vercel logs for errors

### Google Sign-in Not Working
- Verify OAuth redirect URIs are updated
- Check `NEXTAUTH_URL` matches deployment URL
- Clear browser cookies and try again

### Messages Not Appearing
- Wait 2-3 seconds (polling interval)
- Check browser console for errors
- Verify `/api/messages` endpoint works

### Build Failing
```bash
# Locally clear cache and rebuild
rm -rf .next
npm run build
```

---

## 📊 What You Get

### Free Tier Limits (Vercel)
- ✅ 100GB bandwidth/month
- ✅ 100,000 serverless invocations/day
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN

**Supports ~50-100 concurrent users** on free tier!

---

## 🎯 Performance Tips

### Reduce Polling Frequency (Save Bandwidth)
Edit `src/lib/hooks/useChat.ts`:
```typescript
refreshInterval: 3000  // 3 seconds instead of 2
```

### Disable Polling When Tab Hidden
```typescript
refreshInterval: 2000,
refreshWhenHidden: false,
```

### Increase Message Limit
Edit `src/app/api/messages/route.ts`:
```typescript
const limit = parseInt(searchParams.get('limit') || '100')
```

---

## 🔄 Continuous Deployment

Vercel auto-deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Vercel automatically deploys ✅
```

---

## 📈 Monitoring

### Vercel Dashboard Shows:
- Deployment status
- Build logs
- Runtime logs
- Bandwidth usage
- Function invocations

### MongoDB Atlas Shows:
- Database size
- Connection count
- Query performance
- Alerts

---

## 🎉 You're Done!

Your chat app is live at: `https://your-app.vercel.app`

Share the link and start chatting! 💬

---

## 🆘 Need Help?

### Check Logs
```bash
# Vercel CLI
vercel logs

# Or in Vercel Dashboard → Deployments → View Logs
```

### Test API Endpoints
```bash
# Test messages endpoint
curl https://your-app.vercel.app/api/rooms

# Should return JSON with rooms
```

### Common Commands
```bash
# Redeploy
vercel --prod

# View domains
vercel domains ls

# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```

---

**🎊 Congratulations! Your serverless chat app is live!**
