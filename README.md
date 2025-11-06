# FinTrack - Budget Planner Mobile App

A comprehensive mobile budget planning application built with Expo (React Native), FastAPI, and MongoDB. Features include income/expense tracking, recurring bills, AI-powered insights, receipt OCR, SMS/Email parsing, and advanced authentication (email/password, Google, Apple, biometric).

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Building the Code](#building-the-code)
- [Running the Application](#running-the-application)
- [Debugging](#debugging)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

#### For Mac:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - Pre-installed or [Download](https://www.python.org/downloads/)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Yarn** - `npm install -g yarn`
- **Expo CLI** - `npm install -g expo-cli`
- **Xcode** (for iOS development) - [Download from App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **Android Studio** (for Android development) - [Download](https://developer.android.com/studio)

#### For Windows:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://www.python.org/downloads/)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Yarn** - `npm install -g yarn`
- **Expo CLI** - `npm install -g expo-cli`
- **Android Studio** (for Android development) - [Download](https://developer.android.com/studio)
- **Windows Subsystem for Linux (WSL2)** - Optional but recommended

### Optional Tools
- **Expo Go App** - Install on your mobile device for testing ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **MongoDB Compass** - GUI for MongoDB - [Download](https://www.mongodb.com/products/compass)
- **Postman** - API testing - [Download](https://www.postman.com/downloads/)
- **VS Code** - Recommended IDE - [Download](https://code.visualstudio.com/)

### API Keys (Optional for Full Functionality)
- **Emergent LLM Key** - For AI features (OCR, insights, SMS/email parsing)
- **Google OAuth Credentials** - For Google Sign-In ([Get Here](https://console.cloud.google.com/))
- **Apple Developer Account** - For Apple Sign-In (iOS only)

---

## 🚀 Environment Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <your-repo-url>
cd fintrack-app

# Or if you have the project folder
cd /path/to/app
```

### 2. Set Up MongoDB

#### Mac:
```bash
# Install MongoDB via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Or run manually
mongod --config /usr/local/etc/mongod.conf

# Verify installation
mongosh
```

#### Windows:
```bash
# After installation, start MongoDB as a service
net start MongoDB

# Or run manually
"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath="C:\data\db"

# Verify installation
mongosh
```

#### Create Database:
```bash
# In mongosh
use budget_planner
db.createCollection("users")
db.createCollection("transactions")
db.createCollection("bills")
db.createCollection("categories")
exit
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
# Mac/Linux:
python3 -m venv venv
source venv/bin/activate

# Windows:
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Mac/Linux:
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017/budget_planner
JWT_SECRET_KEY=your-secret-key-change-in-production-$(openssl rand -hex 32)
EMERGENT_LLM_KEY=your-emergent-llm-key-here
EOF

# Windows (PowerShell):
@"
MONGO_URL=mongodb://localhost:27017/budget_planner
JWT_SECRET_KEY=your-secret-key-change-in-production
EMERGENT_LLM_KEY=your-emergent-llm-key-here
"@ | Out-File -FilePath .env -Encoding utf8

# Verify installation
pip list
python -c "import fastapi; print('FastAPI installed!')"
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
yarn install

# Create .env file
# Mac/Linux:
cat > .env << EOF
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
EXPO_TUNNEL_SUBDOMAIN=money-manager
EXPO_PACKAGER_HOSTNAME=localhost
EXPO_PACKAGER_PROXY_URL=http://localhost:3000
EXPO_USE_FAST_RESOLVER=1
METRO_CACHE_ROOT=./.metro-cache
EOF

# Windows (PowerShell):
@"
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
EXPO_TUNNEL_SUBDOMAIN=money-manager
EXPO_PACKAGER_HOSTNAME=localhost
EXPO_PACKAGER_PROXY_URL=http://localhost:3000
EXPO_USE_FAST_RESOLVER=1
METRO_CACHE_ROOT=./.metro-cache
"@ | Out-File -FilePath .env -Encoding utf8

# Verify installation
yarn --version
npx expo --version
```

### 5. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "FinTrack"
3. Enable APIs:
   - Google+ API
   - Google People API
4. Configure OAuth Consent Screen:
   - User Type: External
   - Add app name, email, logo
   - Add scopes: email, profile
5. Create Credentials → OAuth 2.0 Client ID:
   - **Web application**: For development
   - **iOS**: Bundle ID (e.g., `com.yourcompany.fintrack`)
   - **Android**: Package name + SHA-1 fingerprint
6. Get SHA-1 for Android:

```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Copy SHA-1 and add to Google Console
```

7. Update `/app/frontend/app/login.tsx`:

```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
});
```

---

## 🔨 Building the Code

### Backend Build

The backend is Python-based and doesn't require a build step, but verify setup:

```bash
cd backend

# Activate virtual environment
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Verify all packages
pip list | grep fastapi
pip list | grep pymongo

# Run syntax check
python -m py_compile server.py

# Optional: Run linting
pip install ruff
ruff check server.py

# Optional: Run tests
pytest  # if you have tests
```

### Frontend Build

#### Development Build:

```bash
cd frontend

# Install dependencies
yarn install

# Check for TypeScript errors
yarn tsc --noEmit

# Check for ESLint errors
npx eslint . --ext .ts,.tsx

# Clear cache if needed
expo start -c
```

#### Production Build (EAS Build):

**Prerequisites:**
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure your project
eas build:configure
```

**Android APK (for testing):**
```bash
# Build preview (APK)
eas build --platform android --profile preview

# Download APK after build completes
# Install on device: adb install app.apk
```

**Android AAB (for Play Store):**
```bash
# Build production (AAB)
eas build --platform android --profile production

# This creates .aab file for Google Play Store upload
```

**iOS IPA (Mac only):**
```bash
# Build for iOS
eas build --platform ios --profile production

# Requires Apple Developer account
# Requires iOS distribution certificate
```

#### Local Build (Android):

**Mac/Linux:**
```bash
cd frontend

# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

**Windows:**
```bash
cd frontend

# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android
gradlew.bat assembleRelease

# APK location:
# android\app\build\outputs\apk\release\app-release.apk
```

#### Web Build:

```bash
cd frontend

# Build for web
npx expo export:web

# Output in web-build/ directory
# Serve with any static server
```

---

## ▶️ Running the Application

### Method 1: Full Development Environment (Recommended)

Open 2 terminals:

#### Terminal 1 - Start Backend:

**Mac/Linux:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Should see:
# INFO:     Uvicorn running on http://0.0.0.0:8001
# INFO:     Application startup complete.
```

**Windows:**
```bash
cd backend
venv\Scripts\activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

#### Terminal 2 - Start Frontend:

**Mac/Linux:**
```bash
cd frontend
expo start

# Or with options:
expo start --clear       # Clear cache
expo start --tunnel      # Tunnel mode
expo start --lan         # LAN mode
```

**Windows:**
```bash
cd frontend
expo start
```

### Method 2: Running on Different Devices

#### A. iOS Simulator (Mac only):

```bash
# After expo start, press 'i' in terminal
# Or:
expo start --ios

# Opens iOS simulator automatically
```

#### B. Android Emulator:

```bash
# Start emulator first in Android Studio
# Tools → AVD Manager → Play button

# Then in Expo terminal, press 'a'
# Or:
expo start --android
```

#### C. Physical Device (Expo Go):

1. Install Expo Go app:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Make sure phone and computer are on same WiFi

3. Scan QR code:
   - iOS: Open Camera app → Scan QR
   - Android: Open Expo Go → Scan QR

#### D. Physical Device (Custom Build):

**Android:**
```bash
# Build APK (see Building section)
# Transfer to device and install

# Or install via ADB
adb install app-release.apk
```

**iOS (Mac only):**
```bash
# Requires Apple Developer account
# Build with EAS or Xcode
# Install via Xcode or TestFlight
```

#### E. Web Browser:

```bash
# After expo start, press 'w'
# Or:
expo start --web

# Opens at http://localhost:19006
# Note: Some features limited on web
```

### Method 3: Production Mode

#### Backend (Production):

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001

# Or with Uvicorn production mode
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

#### Frontend (Production):

```bash
# Use EAS Build (see Building section)
# Or serve web build
cd frontend
npx expo export:web
npx serve web-build
```

### Method 4: Docker (Optional)

**Backend Dockerfile:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

```bash
# Build and run
docker build -t fintrack-backend ./backend
docker run -p 8001:8001 fintrack-backend
```

---

## 🐛 Debugging

### Backend Debugging

#### Method 1: VS Code Debugger (Recommended)

1. Create `.vscode/launch.json` in project root:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI Backend",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "server:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8001"
      ],
      "jinja": true,
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      }
    }
  ]
}
```

2. Open `backend/server.py`
3. Click on line numbers to set breakpoints (red dots)
4. Press **F5** or **Run → Start Debugging**
5. Trigger API endpoint to hit breakpoint
6. Use debug toolbar to step through code

#### Method 2: Print Debugging

```python
# Add to server.py
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Use in code
print(f"Debug: Variable value = {variable}")
logger.debug(f"Processing transaction: {transaction}")
logger.info(f"User logged in: {user_email}")
logger.error(f"Error occurred: {error}")
```

#### Method 3: Python Debugger (pdb)

```python
# Add where you want to break
import pdb; pdb.set_trace()

# Or use ipdb (prettier)
# pip install ipdb
import ipdb; ipdb.set_trace()

# Commands:
# n - next line
# s - step into
# c - continue
# p variable - print variable
# l - list code
# q - quit
```

#### Method 4: API Testing with Postman

```bash
# Import API collection
# Test endpoints:
curl http://localhost:8001/api/health
curl http://localhost:8001/api/transactions
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

#### Check Backend Logs:

```bash
# In terminal where uvicorn is running
# All requests and errors appear here

# Or redirect to file
uvicorn server:app --reload --log-level debug > backend.log 2>&1
tail -f backend.log
```

### Frontend Debugging

#### Method 1: React DevTools (Recommended)

```bash
# Install
npm install -g react-devtools

# Start React DevTools
react-devtools

# In Expo app:
# Shake device or press Cmd+D (iOS) / Cmd+M (Android)
# Select "Toggle Element Inspector"
# DevTools will connect automatically
```

#### Method 2: Chrome DevTools

```bash
# In Expo app, open Dev Menu:
# iOS Simulator: Cmd+D
# Android Emulator: Cmd+M (Mac) or Ctrl+M (Windows)
# Physical Device: Shake device

# Select "Debug Remote JS"
# Chrome opens at http://localhost:19000/debugger-ui
# Open Chrome DevTools: F12 or Cmd+Option+I
# Console tab shows all console.log output
```

#### Method 3: VS Code Debugger

1. Install extension: "React Native Tools"
2. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Expo",
      "type": "reactnative",
      "request": "attach",
      "cwd": "${workspaceFolder}/frontend",
      "platform": "android"  // or "ios"
    },
    {
      "name": "Debug in Exponent",
      "type": "reactnative",
      "request": "launch",
      "platform": "exponent",
      "cwd": "${workspaceFolder}/frontend"
    }
  ]
}
```

3. Start Expo: `expo start`
4. Press **F5** in VS Code
5. Select configuration
6. Set breakpoints in `.tsx` files

#### Method 4: Console Logging

```typescript
// In any component or function
console.log('Debug:', data);
console.warn('Warning:', warning);
console.error('Error:', error);
console.table(arrayData);  // Nice table format
console.dir(object, { depth: null });  // Full object

// Conditional logging
if (__DEV__) {
  console.log('Development only log');
}

// View logs in terminal where `expo start` is running
```

#### Method 5: React Native Debugger (Advanced)

```bash
# Install
# Mac:
brew install --cask react-native-debugger

# Windows: Download from
# https://github.com/jhen0409/react-native-debugger/releases

# Start debugger
open "rndebugger://set-debugger-loc?host=localhost&port=19000"

# In Expo app: Enable "Debug Remote JS"
# Debugger automatically connects
```

### Network Debugging

#### Monitor API Calls:

```typescript
// Add to axios calls
import axios from 'axios';

axios.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});

axios.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});
```

#### Use Flipper (Advanced):

```bash
# Install Flipper
# Mac:
brew install --cask flipper

# Windows: Download from
# https://fbflipper.com/

# Install expo-dev-client
npx expo install expo-dev-client

# Start Flipper app
# Run expo with dev client
expo start --dev-client
```

### Debugging Specific Issues

#### Issue: Backend Not Responding

```bash
# 1. Check if backend is running
curl http://localhost:8001/api/health

# 2. Check if port is in use
# Mac/Linux:
lsof -i :8001
kill -9 <PID>

# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# 3. Check MongoDB connection
mongosh
use budget_planner
db.stats()

# 4. Check backend logs for errors
```

#### Issue: Frontend Not Loading

```bash
# 1. Clear Metro bundler cache
expo start -c

# 2. Clear node modules
rm -rf node_modules
yarn install

# 3. Clear Expo cache
rm -rf .expo
rm -rf node_modules/.cache

# 4. Clear watchman (Mac only)
watchman watch-del-all

# 5. Reset everything
yarn cache clean
rm -rf node_modules .expo .metro-cache
yarn install
expo start -c
```

#### Issue: "Unable to resolve module"

```bash
# Install missing package
yarn add <package-name>

# Or check import path
# Correct: import { View } from 'react-native'
# Wrong: import { View } from 'react-native-web'
```

#### Issue: App Crashes on Device

```bash
# View crash logs
# iOS:
xcrun simctl spawn booted log stream --predicate 'process == "Expo"' --level debug

# Android:
adb logcat -v brief *:E

# Or use Expo logs
expo start
# Then check terminal output when crash occurs
```

#### Issue: Authentication Not Working

```bash
# 1. Check backend logs
# Look for JWT errors, database errors

# 2. Test login endpoint directly
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 3. Check AsyncStorage
# In app:
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getAllKeys().then(keys => console.log(keys));
AsyncStorage.getItem('authToken').then(token => console.log(token));

# 4. Clear AsyncStorage
AsyncStorage.clear();
```

#### Issue: Network Request Failed (Physical Device)

```bash
# Update frontend/.env with your computer's IP
# Find your IP:
# Mac:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig | findstr IPv4

# Linux:
ip addr show | grep "inet "

# Update .env:
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.XXX:8001

# Restart expo
```

### Performance Debugging

```bash
# Enable performance monitor
# In Expo app: Dev Menu → Show Performance Monitor

# Profile with Hermes (production builds)
# Add to app.json:
{
  "expo": {
    "jsEngine": "hermes"
  }
}

# Analyze bundle size
npx expo export --dump-sourcemap
npm install -g source-map-explorer
source-map-explorer bundle.js bundle.js.map
```

### Advanced Debugging Tools

#### Reactotron (Recommended for React Native):

```bash
# Install
yarn add --dev reactotron-react-native

# Create config file: frontend/ReactotronConfig.ts
import Reactotron from 'reactotron-react-native';

Reactotron
  .configure()
  .useReactNative()
  .connect();

// In App.tsx
import './ReactotronConfig';

# Download Reactotron app
# Mac:
brew install --cask reactotron

# Windows: Download from
# https://github.com/infinitered/reactotron/releases
```

---

## 📁 Project Structure

```
fintrack-app/
├── README.md                  # This file
├── backend/
│   ├── server.py              # FastAPI application (750+ lines)
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (git-ignored)
│   └── venv/                  # Virtual environment (git-ignored)
│
├── frontend/
│   ├── app/                   # Expo Router screens (file-based routing)
│   │   ├── (tabs)/           # Tab-based navigation
│   │   │   ├── _layout.tsx   # Tab navigator configuration
│   │   │   ├── index.tsx     # Dashboard (Home)
│   │   │   ├── analytics.tsx # Analytics with AI insights
│   │   │   ├── bills.tsx     # Bills management
│   │   │   └── settings.tsx  # Settings with biometric toggle
│   │   │
│   │   ├── _layout.tsx       # Root layout with AuthProvider
│   │   ├── login.tsx         # Login (email/social/biometric)
│   │   ├── register.tsx      # Registration
│   │   ├── forgot-password.tsx
│   │   ├── add-transaction.tsx
│   │   ├── camera.tsx        # Receipt OCR
│   │   ├── sms-parser.tsx    # SMS parsing
│   │   ├── email-parser.tsx  # Email parsing
│   │   ├── upi-payments.tsx  # UPI payments
│   │   ├── monthly-summary.tsx
│   │   └── privacy-policy.tsx
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication context
│   │
│   ├── store/
│   │   └── budgetStore.ts    # Zustand state management
│   │
│   ├── assets/               # Images, icons
│   │   ├── icon.png
│   │   ├── splash.png
│   │   └── favicon.png
│   │
│   ├── app.json              # Expo configuration
│   ├── package.json          # Dependencies
│   ├── tsconfig.json         # TypeScript config
│   ├── babel.config.js       # Babel config
│   ├── metro.config.js       # Metro bundler config
│   ├── eas.json              # EAS Build config
│   ├── .env                  # Environment variables (git-ignored)
│   └── node_modules/         # Dependencies (git-ignored)
│
├── tests/                    # Test files
│   └── __init__.py
│
├── .gitignore
└── config.json
```

---

## ✨ Features

### Core Features
- ✅ **Income/Expense Tracking** - Add, edit, delete transactions
- ✅ **Category Management** - Pre-defined and custom categories
- ✅ **Recurring Bills** - Automatic monthly bill generation
- ✅ **UPI Payments** - Track UPI transactions
- ✅ **Monthly Summary** - Tabular view of finances

### AI-Powered Features
- ✅ **Receipt OCR** - Scan receipts → Auto-extract transaction details
- ✅ **SMS Parsing** - Parse banking SMS → Create transactions
- ✅ **Email Parsing** - Parse credit card emails → Create bills
- ✅ **AI Financial Insights** - Get personalized financial advice

### Authentication
- ✅ **Email/Password** - Traditional login/registration
- ✅ **Google Sign-In** - OAuth 2.0 integration
- ✅ **Apple Sign-In** - Native iOS authentication
- ✅ **Biometric Auth** - Touch ID / Face ID / Fingerprint
- ✅ **Protected Routes** - Auto-redirect based on auth status
- ✅ **Password Reset** - Forgot password flow
- ✅ **JWT Tokens** - Secure session management

### Analytics
- ✅ **Pocket Money** - Available funds calculation
- ✅ **Daily Spendable** - Per-day budget
- ✅ **Balance Tracking** - Real-time balance
- ✅ **Amount Required** - Upcoming bill payments
- ✅ **Total Income/Expense** - Period-wise summaries

### UI/UX
- ✅ **Modern Design** - Clean, intuitive interface
- ✅ **Dark Mode Support** - Comfortable viewing
- ✅ **Responsive Layout** - Works on all screen sizes
- ✅ **Toast Notifications** - User feedback
- ✅ **Loading States** - Clear feedback during operations
- ✅ **Error Handling** - Graceful error messages

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:8001
Production: https://your-domain.com
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response: {
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Social Login
```http
POST /api/auth/social-login
Content-Type: application/json

{
  "provider": "google",  // or "apple"
  "token": "oauth_token_here",
  "email": "user@example.com",
  "name": "John Doe"
}

Response: {
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: {
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-15T10:00:00"
  }
}
```

#### Reset Password
```http
PUT /api/auth/reset-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}

Response: {
  "message": "Password updated successfully"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: {
  "message": "Password reset instructions sent to your email"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response: {
  "message": "Logged out successfully"
}
```

### Transaction Endpoints

#### Get Transactions
```http
GET /api/transactions?type=expense&month=2025-01

Response: [
  {
    "_id": "...",
    "type": "expense",
    "amount": 100.50,
    "category": "Food",
    "description": "Lunch",
    "date": "2025-01-15",
    "createdAt": "2025-01-15T12:00:00"
  }
]
```

#### Create Transaction
```http
POST /api/transactions
Content-Type: application/json

{
  "type": "expense",  // or "income"
  "amount": 100.50,
  "category": "Food",
  "description": "Lunch at cafe",
  "date": "2025-01-15"
}

Response: {
  "transaction": { ... }
}
```

#### Update Transaction
```http
PUT /api/transactions/{id}
Content-Type: application/json

{
  "amount": 120.00,
  "description": "Updated description"
}

Response: {
  "transaction": { ... }
}
```

#### Delete Transaction
```http
DELETE /api/transactions/{id}

Response: {
  "message": "Transaction deleted successfully"
}
```

### Bills Endpoints

#### Get Bills
```http
GET /api/bills?isPaid=false

Response: [
  {
    "_id": "...",
    "name": "Electricity",
    "amount": 150.00,
    "dueDate": "2025-01-30",
    "isPaid": false,
    "isRecurring": true,
    "recurringDay": 30
  }
]
```

#### Create Bill
```http
POST /api/bills
Content-Type: application/json

{
  "name": "Internet Bill",
  "amount": 99.99,
  "dueDate": "2025-01-25",
  "isPaid": false,
  "category": "Utilities",
  "isRecurring": true,
  "recurringDay": 25
}

Response: {
  "bill": { ... }
}
```

#### Update Bill
```http
PUT /api/bills/{id}
Content-Type: application/json

{
  "isPaid": true,
  "amount": 105.00
}

Response: {
  "bill": { ... }
}
```

#### Delete Bill
```http
DELETE /api/bills/{id}

Response: {
  "message": "Bill deleted successfully"
}
```

### AI Endpoints

#### OCR Receipt
```http
POST /api/ocr-receipt
Content-Type: multipart/form-data

file: <image file>

Response: {
  "merchant": "Starbucks",
  "amount": 12.50,
  "date": "2025-01-15",
  "items": ["Coffee", "Muffin"]
}
```

#### Parse SMS
```http
POST /api/parse/sms
Content-Type: application/json

{
  "body": "Your A/c X1234 is debited by Rs.2,500.00 on 15-01-25. UPI Ref: 432165489723. Amazon Pay",
  "date": "2025-01-15"
}

Response: {
  "isTransaction": true,
  "type": "expense",
  "amount": 2500.00,
  "merchant": "Amazon Pay",
  "date": "2025-01-15",
  "category": "Shopping",
  "isUPI": true
}
```

#### Parse Email
```http
POST /api/parse/email
Content-Type: application/json

{
  "subject": "Your Credit Card Statement",
  "body": "Current Balance: $1,234.75\nDue Date: February 15, 2025",
  "date": "2025-01-15"
}

Response: {
  "isBill": true,
  "billName": "Credit Card",
  "amount": 1234.75,
  "dueDate": "2025-02-15"
}
```

#### Get AI Insights
```http
GET /api/analytics/ai-insights

Response: {
  "insights": "Based on your spending patterns, here are some recommendations:\n1. Your food expenses are 30% higher than average...\n2. Consider setting aside $500/month for savings..."
}
```

### Analytics Endpoints

#### Pocket Money
```http
GET /api/analytics/pocket-money

Response: {
  "pocketMoney": 5000.00,
  "dailySpendable": 166.67,
  "daysRemaining": 30
}
```

#### Amount Required
```http
GET /api/analytics/amount-required

Response: {
  "amountRequired": 450.00,
  "unpaidBills": 3
}
```

#### Balance
```http
GET /api/analytics/balance

Response: {
  "totalIncome": 50000.00,
  "totalExpense": 35000.00,
  "paidBills": 5000.00,
  "balance": 10000.00
}
```

#### Total Expense
```http
GET /api/analytics/total-expense

Response: {
  "totalExpense": 35000.00,
  "transactionExpense": 30000.00,
  "billExpense": 5000.00
}
```

### Categories Endpoint

```http
GET /api/categories

Response: [
  {
    "_id": "...",
    "name": "Food",
    "type": "expense",
    "icon": "🍔",
    "color": "#FF6B6B"
  }
]
```

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
# Mac:
brew services list | grep mongodb

# Windows:
sc query MongoDB

# Start MongoDB
# Mac:
brew services start mongodb-community

# Windows:
net start MongoDB

# Verify connection
mongosh mongodb://localhost:27017
```

#### 2. Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::8001`

**Solution:**
```bash
# Find and kill process
# Mac/Linux:
lsof -ti:8001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

#### 3. Module Not Found

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Error:** `Unable to resolve module 'expo-auth-session'`

**Solution:**
```bash
cd frontend
yarn add expo-auth-session expo-web-browser
expo start -c
```

#### 4. Expo Metro Bundler Issues

**Error:** `Metro bundler has encountered an internal error`

**Solution:**
```bash
# Clear all caches
cd frontend
rm -rf node_modules
rm -rf .expo
rm -rf .metro-cache
yarn cache clean
yarn install
expo start -c

# If still failing:
watchman watch-del-all  # Mac only
npm start -- --reset-cache
```

#### 5. Build Failed

**Error:** `Build failed with error: ...`

**Solution:**
```bash
# Android:
cd frontend/android
./gradlew clean
cd ..
npx expo prebuild --clean

# iOS:
cd frontend/ios
pod deintegrate
pod install
cd ..
npx expo prebuild --clean
```

#### 6. Google Sign-In Not Working

**Error:** `GoogleSignIn error 10`

**Solution:**
- Verify OAuth credentials in Google Console
- Check SHA-1 fingerprint matches
- Ensure package name matches
- Check redirect URI configuration
- Verify Google+ API is enabled

#### 7. Biometric Auth Not Available

**Issue:** Biometric toggle doesn't appear

**Solution:**
- Ensure device has biometric hardware
- iOS: Settings → Face ID & Passcode → Set up
- Android: Settings → Security → Biometric
- Check device compatibility
- Verify permissions in app.json

#### 8. Network Request Failed on Physical Device

**Error:** `[AxiosError: Network Error]`

**Solution:**
```bash
# Get your computer's IP
# Mac:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig | findstr IPv4

# Update frontend/.env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.XXX:8001

# Restart expo
expo start -c
```

#### 9. AsyncStorage Not Working

**Error:** `null is not an object (evaluating 'AsyncStorage.getItem')`

**Solution:**
```bash
cd frontend
yarn add @react-native-async-storage/async-storage
expo start -c
```

#### 10. JWT Token Invalid

**Error:** `401 Unauthorized`

**Solution:**
```typescript
// Clear stored token
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.removeItem('authToken');

// Re-login to get new token
```

---

## 📱 Platform-Specific Notes

### iOS

- Requires Xcode (Mac only)
- Biometric requires iOS 11+
- Apple Sign-In requires iOS 13+
- Test on simulator or physical device
- Submit to App Store requires Apple Developer account ($99/year)

### Android

- Works on Windows/Mac/Linux
- Biometric requires Android 6.0+
- Test on emulator or physical device
- Google Play requires one-time $25 fee

### Web

- Limited biometric support
- No native notifications
- Camera access limited
- Use for testing only

---

## 🚀 Deployment Guides

### Backend Deployment (Example: Heroku)

```bash
# Install Heroku CLI
# Create Procfile
echo "web: uvicorn server:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
heroku create fintrack-backend
heroku addons:create mongodb:sandbox
heroku config:set JWT_SECRET_KEY=your-secret
git push heroku main
```

### Frontend Deployment (App Stores)

```bash
# Build
eas build --platform all --profile production

# Submit to Google Play
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

---

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributors

- Your Name - Initial work

## 📞 Support

- Issues: GitHub Issues
- Email: support@fintrack.com
- Documentation: https://docs.fintrack.com

---

## 🎯 Quick Start Checklist

- [ ] Install Node.js, Python, MongoDB
- [ ] Install Yarn and Expo CLI
- [ ] Clone repository
- [ ] Set up virtual environment (backend)
- [ ] Install backend dependencies
- [ ] Create backend .env file
- [ ] Install frontend dependencies  
- [ ] Create frontend .env file
- [ ] Start MongoDB service
- [ ] Start backend (uvicorn)
- [ ] Start frontend (expo)
- [ ] Open app (Expo Go or simulator)
- [ ] Create test account
- [ ] Test core features
- [ ] Enable biometric (if available)
- [ ] Test social login (if configured)

**🎉 Happy Coding! Build amazing budget tracking experiences!**
