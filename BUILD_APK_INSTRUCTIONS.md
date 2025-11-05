# Build APK for FinTrack App

## ✅ Build Configuration Ready!

Your app is already configured to build APK files. Follow these steps:

---

## 🚀 Quick Build Instructions

### Method 1: Using EAS Build (Recommended - Cloud Build)

#### Step 1: Login to Expo
```bash
cd /app/frontend
eas login
```
Enter your Expo account credentials (or create a free account at expo.dev)

#### Step 2: Build the APK
```bash
eas build --platform android --profile preview
```

**What this does:**
- Builds your app in the cloud (no local setup needed)
- Creates an APK file (installable directly on Android)
- Takes about 10-20 minutes
- Free for unlimited builds!

#### Step 3: Download APK
After build completes:
- You'll get a link to download the APK
- Or visit: https://expo.dev/accounts/YOUR_USERNAME/projects/fintrack/builds
- Download the APK file
- Transfer to your phone and install

---

## 📱 Alternative: Local Build (Faster but requires setup)

If you want to build locally and already have Android SDK installed:

```bash
cd /app/frontend
npx expo run:android --variant release
```

This requires:
- Android SDK
- Java JDK
- Android device connected or emulator running

---

## 🎯 For Testing on Your Phone

### Option A: Direct Install (APK file)
1. Build APK using Method 1 above
2. Transfer APK to your phone
3. Enable "Install from Unknown Sources" in phone settings
4. Tap APK file to install
5. Open FinTrack app

### Option B: Expo Go (No build needed - Instant testing)
1. Install "Expo Go" app from Play Store
2. Open your Emergent dashboard
3. Scan the QR code shown for your app
4. App opens instantly in Expo Go
5. ⚠️ Note: Some features may not work in Expo Go (camera, notifications)

---

## 📋 Build Output

After successful build, you'll get:
```
✔ Build finished
  https://expo.dev/artifacts/eas/[UNIQUE_ID].apk
  
  APK Size: ~40-60 MB
  Minimum Android: 6.0 (API 23)
  Target Android: 14 (API 34)
```

---

## 🔧 Build Configuration Details

### Current Setup:
- **Profile**: preview (APK format)
- **Distribution**: internal (for testing)
- **Package**: com.fintrack.budgetplanner
- **Version**: 1.0.0
- **SDK Version**: 52

### Files Already Configured:
- ✅ `eas.json` - Build profiles
- ✅ `app.json` - App configuration
- ✅ Package name and version set
- ✅ Permissions declared
- ✅ Icons and splash configured

---

## 🐛 Troubleshooting

### Build Fails?
```bash
# Check if you're logged in
eas whoami

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

### Need to update app before building?
```bash
# Make your code changes first, then:
git add .
git commit -m "Update before build"
eas build --platform android --profile preview
```

---

## 💡 Build Profiles Explained

### preview (Use this for testing)
- Creates APK file
- Can install directly on any Android device
- Perfect for testing before Play Store
- Build command: `eas build -p android --profile preview`

### production (Use for Play Store)
- Creates AAB (Android App Bundle)
- Required for Google Play Store
- Smaller download size
- Build command: `eas build -p android --profile production`

---

## 📊 Expected Build Time

- **First build**: 15-25 minutes (downloads dependencies)
- **Subsequent builds**: 8-15 minutes (uses cache)
- **Build queue time**: 0-5 minutes (if queue is busy)

---

## ✅ After Build Completes

You'll receive:
1. **Download URL** - Direct link to APK file
2. **QR Code** - Scan to download on phone
3. **Email notification** - Build complete alert
4. **Dashboard link** - View in Expo dashboard

---

## 🔐 Important Notes

1. **Backend URL**: Make sure your backend is accessible from mobile
   - Current: Using `/api` prefix
   - Production: Update to your deployed backend URL

2. **API Keys**: 
   - Emergent LLM key is included
   - Works for testing and production

3. **First Install**:
   - Android will show "Unknown app" warning
   - This is normal for APKs not from Play Store
   - Click "Install Anyway"

4. **Permissions**:
   - Camera access required for receipt scanning
   - Notification permission for bill reminders
   - App will request these on first use

---

## 🚀 Quick Start (Copy-Paste Ready)

```bash
# 1. Navigate to frontend
cd /app/frontend

# 2. Login to Expo (one-time)
eas login

# 3. Build APK
eas build --platform android --profile preview

# 4. Wait for build to complete (10-20 mins)
# 5. Download APK from the link provided
# 6. Install on your phone and test!
```

---

## 📱 What to Test

After installing, test these features:
- ✅ Add income/expense transactions
- ✅ Calendar date picker
- ✅ Camera receipt scanning
- ✅ Add recurring bills
- ✅ View analytics and charts
- ✅ Pocket money calculation
- ✅ Monthly summary table
- ✅ Delete transactions/bills
- ✅ Privacy policy screen

---

## 🆘 Need Help?

If build fails or you encounter issues:
1. Check build logs in Expo dashboard
2. Ensure all dependencies are installed
3. Check if backend is running
4. Verify app.json configuration
5. Try clearing build cache: `eas build --clear-cache`

---

## 🎉 Success Criteria

Your APK is ready when you see:
- ✅ Build completed successfully
- ✅ APK file downloaded
- ✅ App installs on phone
- ✅ All features working
- ✅ No crashes on launch

**Ready to build? Run the Quick Start commands above!**
