# FinTrack AI Agent Instructions

## Project Architecture

This is a full-stack mobile budget planning application with the following major components:

### Frontend (Expo/React Native)
- Located in `/frontend`
- Uses Expo Router for navigation (see `app/_layout.tsx` and `app/(tabs)/_layout.tsx`)
- Implements tab-based navigation in `app/(tabs)/` for main app flows
- State management via contexts (`contexts/AuthContext.tsx`) and stores (`store/budgetStore.ts`)
- Screens follow naming pattern: `[feature-name].tsx` (e.g., `add-transaction.tsx`, `monthly-summary.tsx`)

### Backend (FastAPI/Python)
- Located in `/backend`
- Main entry point: `server.py`
- Uses MongoDB for data persistence
- Integrates with Emergent LLM for AI features

## Key Integration Points

1. Authentication Flow
- Frontend auth context (`contexts/AuthContext.tsx`) manages user session
- Supports email/password, Google, Apple, and biometric auth
- Protected routes require valid JWT token

2. AI Features
- Receipt OCR via camera (`app/camera.tsx`)
- SMS/Email parsing (`app/sms-parser.tsx`, `app/email-parser.tsx`)
- Uses Emergent LLM API (requires API key in backend)

## Development Workflow

### Setup Commands
```bash
# Frontend
cd frontend
yarn install
yarn start    # Start Expo development server

# Backend
cd backend
pip install -r requirements.txt
python server.py
```

### Common Development Tasks

1. Adding New Screens
- Create new file in `frontend/app/` following existing naming patterns
- Update navigation if needed in `app/_layout.tsx` or `app/(tabs)/_layout.tsx`

2. Implementing New Features
- Frontend changes go in relevant screen files or shared components
- Backend endpoints added to `server.py`
- State updates handled through appropriate store/context

## Testing & Debugging

- Use Expo Go app on physical devices for testing
- Backend testing handled in `tests/` directory
- Set `DEBUG=True` in backend for detailed logs
- MongoDB Compass recommended for database inspection

## External Dependencies

- MongoDB must be running locally
- Emergent LLM API key required for AI features
- Google/Apple developer credentials needed for social auth

## Project Conventions

1. File Structure:
- Frontend screens in `app/` directory
- Reusable components in shared folders
- Backend follows FastAPI convention with central `server.py`

2. Naming:
- Screen files use kebab-case
- Components use PascalCase
- API endpoints use snake_case

3. State Management:
- Authentication state in AuthContext
- Budget/transaction data in budgetStore
- Local storage via AsyncStorage

## Important Files for Reference

- `/frontend/app/_layout.tsx` - Main navigation structure
- `/frontend/contexts/AuthContext.tsx` - Auth pattern example
- `/frontend/store/budgetStore.ts` - State management pattern
- `/backend/server.py` - API structure and patterns