# Secure AI API Configuration

## Security Notice
API keys are now stored securely on the server only. Never expose API keys on the client side.

## Setup Instructions

### 1. Environment Variables
Set the following environment variable on the server (NOT prefixed with VITE_):

```bash
# Server-side only - DO NOT prefix with VITE_
AI_API_KEY=your-api-key-here
```

### 2. Available Endpoints
All AI functionality is now securely processed on the backend:

- **POST /api/ai/analyze** - Analyzes emotions and generates therapeutic response
- **POST /api/ai/bls** - Generates adaptive BLS configuration
- **POST /api/ai/insights** - Retrieves therapeutic insights
- **POST /api/ai/predict-phase** - Predicts optimal next phase

### 3. Security Features
- ✅ API keys stored server-side only
- ✅ Request validation with Zod schemas
- ✅ Error handling without exposing sensitive data
- ✅ No client-side API key exposure

### 4. Implementation Details
- Backend service: `server/services/aiTherapist.ts`
- Routes: `server/routes.ts`
- Client service: `client/src/services/ai/therapist.ts` (uses fetch to backend)

## Important Notes
- The old VITE_AI_API_KEY is no longer used
- All AI processing happens on the server
- Client makes secure API calls to backend endpoints
- Fallback responses available when API is not configured