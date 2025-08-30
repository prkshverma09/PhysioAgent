# Fit4Life API Documentation

## Overview

This document provides comprehensive API documentation for the Fit4Life physiotherapy application. The application consists of several key components that work together to provide AI-powered physiotherapy assistance.

## Table of Contents

1. [Authentication](#authentication)
2. [Core Components](#core-components)
3. [AI Integration](#ai-integration)
4. [Database Schema](#database-schema)
5. [Voice Services](#voice-services)
6. [Session Management](#session-management)
7. [Error Handling](#error-handling)

## Authentication

### Supabase Auth Integration

The application uses Supabase for authentication and user management.

#### Configuration
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const createClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Auth Flow
1. **Sign Up**: Users register with email/password
2. **Sign In**: Users authenticate with credentials
3. **Session Management**: Automatic session handling
4. **Sign Out**: Secure logout with session cleanup

#### User Metadata
```typescript
interface UserMetadata {
  first_name?: string
  last_name?: string
  date_of_birth?: string
  phone?: string
  medical_conditions?: string[]
}
```

## Core Components

### ConversationInterface

The main chat interface component that handles AI conversations and user interactions.

#### Props Interface
```typescript
interface ConversationInterfaceProps {
  onShowExercise: () => void
}
```

#### State Management
```typescript
interface Message {
  id: string
  text: string
  sender: "agent" | "user"
  timestamp: Date
  isVoice?: boolean
  confidence?: number
}

interface ConversationState {
  messages: Message[]
  inputValue: string
  showStats: boolean
  currentStep: number
  painLevel: number | null
  painLocation: string
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  voiceSupported: boolean
}
```

#### Key Methods

**addMessage**
```typescript
async function addMessage(
  text: string, 
  sender: "agent" | "user", 
  isVoice = false, 
  confidence?: number
): Promise<void>
```
Adds a new message to the conversation and logs the interaction.

**handleUserInput**
```typescript
async function handleUserInput(
  text: string, 
  isVoice = false, 
  confidence?: number
): Promise<void>
```
Processes user input, generates AI response, and updates conversation state.

**handleVoiceTranscript**
```typescript
function handleVoiceTranscript(result: SpeechRecognitionResult): void
```
Handles real-time voice recognition results.

### usePatientSession Hook

Custom hook for managing patient sessions and interactions.

#### Interface
```typescript
interface PatientSessionHook {
  currentSession: PatientSession | null
  startSession: () => Promise<void>
  endSession: (data?: SessionEndData) => Promise<void>
  logInteraction: (type: string, data?: any) => Promise<void>
  updateSession: (updates: Partial<PatientSession>) => Promise<void>
}
```

#### Methods

**startSession**
```typescript
async function startSession(): Promise<void>
```
Creates a new patient session and initializes tracking.

**endSession**
```typescript
async function endSession(data?: {
  completedExercise?: boolean
  exerciseFeedback?: string
  painLevelAfter?: number
  bookingRequested?: boolean
  bookingId?: string
}): Promise<void>
```
Ends the current session with optional completion data.

**logInteraction**
```typescript
async function logInteraction(
  type: string, 
  data?: any
): Promise<void>
```
Logs user interactions for analytics and debugging.

**updateSession**
```typescript
async function updateSession(
  updates: Partial<PatientSession>
): Promise<void>
```
Updates session data with new information.

## AI Integration

### OpenAI Service

The application integrates with OpenAI GPT-4 for intelligent conversation and exercise recommendations.

#### Configuration
```typescript
// lib/openai.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

#### Core Functions

**generatePhysioResponse**
```typescript
async function generatePhysioResponse(
  userMessage: string, 
  context: ConversationContext
): Promise<PhysioResponse>
```

**Parameters:**
- `userMessage`: The user's input text
- `context`: Conversation context including history and patient info

**Returns:**
```typescript
interface PhysioResponse {
  text: string
  shouldSpeak: boolean
  suggestedActions?: string[]
  confidence: number
  nextStep?: number
}
```

**generateExerciseRecommendation**
```typescript
async function generateExerciseRecommendation(
  painLevel: number,
  painLocation: string,
  context: ConversationContext
): Promise<PhysioResponse>
```

**extractPainInfo**
```typescript
function extractPainInfo(userMessage: string): {
  painLevel: number | null
  painLocation: string | null
  confidence: number
}
```

#### Conversation Context
```typescript
interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
  }>
  patientInfo?: {
    painLevel?: number
    painLocation?: string
    medicalConditions?: string[]
    sessionStart?: Date
  }
  currentStep?: number
  sessionId?: string
}
```

### AI Prompt Engineering

The application uses carefully crafted prompts to ensure:
- Professional physiotherapy guidance
- UK NHS standards compliance
- Safety-first approach
- Voice-friendly responses

#### System Prompt Template
```
You are Fit4Life, a professional AI physiotherapy assistant. Your role is to:

1. Assess and Understand: Help patients describe their pain levels (1-10) and locations
2. Educate: Provide clear, simple explanations about physiotherapy concepts
3. Guide: Suggest appropriate exercises and self-care techniques
4. Support: Offer encouragement and motivation for recovery
5. Safety: Always recommend seeking professional help for severe or persistent issues

Key Guidelines:
- Be empathetic, professional, and encouraging
- Use simple, clear language suitable for voice interaction
- Focus on UK NHS physiotherapy standards
- Keep responses concise but informative (2-3 sentences for voice)
- Ask follow-up questions to gather more information
- Provide actionable advice when possible
```

## Database Schema

### Tables Overview

The application uses three main tables for data management:

1. **patients**: User profile information
2. **patient_sessions**: Session tracking and outcomes
3. **patient_interactions**: Detailed interaction logging

### Patients Table
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  medical_conditions TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Patient Sessions Table
```sql
CREATE TABLE patient_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  pain_level_initial INTEGER CHECK (pain_level_initial >= 1 AND pain_level_initial <= 10),
  pain_location TEXT,
  symptoms TEXT[],
  completed_exercise BOOLEAN DEFAULT FALSE,
  exercise_feedback TEXT,
  pain_level_after INTEGER CHECK (pain_level_after >= 1 AND pain_level_after <= 10),
  booking_requested BOOLEAN DEFAULT FALSE,
  booking_id TEXT,
  session_data JSONB
);
```

### Patient Interactions Table
```sql
CREATE TABLE patient_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES patient_sessions(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  interaction_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

```sql
-- Patients table policies
CREATE POLICY "patients_select_own" ON patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "patients_insert_own" ON patients FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "patients_update_own" ON patients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "patients_delete_own" ON patients FOR DELETE USING (auth.uid() = id);

-- Sessions table policies
CREATE POLICY "sessions_select_own" ON patient_sessions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "sessions_insert_own" ON patient_sessions FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "sessions_update_own" ON patient_sessions FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "sessions_delete_own" ON patient_sessions FOR DELETE USING (auth.uid() = patient_id);

-- Interactions table policies
CREATE POLICY "interactions_select_own" ON patient_interactions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM patient_sessions ps 
    WHERE ps.id = session_id AND ps.patient_id = auth.uid()
  ));
CREATE POLICY "interactions_insert_own" ON patient_interactions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM patient_sessions ps 
    WHERE ps.id = session_id AND ps.patient_id = auth.uid()
  ));
```

## Voice Services

### Web Speech API Integration

The application uses the Web Speech API for voice recognition and synthesis.

#### Voice Recognition
```typescript
// lib/voice-services.ts
interface SpeechRecognitionResult {
  transcript: string
  isFinal: boolean
  confidence: number
}

class VoiceRecognitionService {
  start(): void
  stop(): void
  onResult(callback: (result: SpeechRecognitionResult) => void): void
}
```

#### Speech Synthesis
```typescript
class SpeechSynthesisService {
  speak(text: string): Promise<void>
  stop(): void
  setVoice(voice: SpeechSynthesisVoice): void
  setRate(rate: number): void
  setPitch(pitch: number): void
}
```

#### Voice Controls Component
```typescript
interface VoiceControlsProps {
  onTranscriptUpdate: (result: SpeechRecognitionResult) => void
  onSpeakText: (text: string) => Promise<void>
  isSpeaking: boolean
  isListening: boolean
  currentText?: string
}
```

### Voice Input Suggestions

The application provides contextual voice input suggestions:

```typescript
const voiceSuggestions = [
  "I have neck pain, level 7",
  "My back hurts when I bend down",
  "I need exercises for my shoulder",
  "The pain is getting worse",
  "I feel better after the exercises"
]
```

## Session Management

### Session Lifecycle

1. **Session Start**: Triggered when user begins conversation
2. **Session Active**: Ongoing interaction tracking
3. **Session End**: Automatic cleanup with completion data

### Session Data Structure
```typescript
interface PatientSession {
  id: string
  patient_id: string
  session_start: string
  session_end?: string
  pain_level_initial?: number
  pain_location?: string
  symptoms?: string[]
  completed_exercise: boolean
  exercise_feedback?: string
  pain_level_after?: number
  booking_requested: boolean
  booking_id?: string
  session_data?: any
}
```

### Interaction Logging

All user interactions are logged for analytics:

```typescript
interface PatientInteraction {
  id: string
  session_id: string
  interaction_type: string
  interaction_data?: any
  timestamp: string
}
```

**Interaction Types:**
- `conversation_start`: Session initiation
- `message`: Text/voice message exchange
- `voice_input`: Voice recognition events
- `exercise_start`: Exercise demonstration start
- `exercise_feedback`: User feedback on exercises
- `booking_flow_start`: Booking process initiation
- `booking_complete`: Booking completion
- `session_end`: Session termination

## Error Handling

### Error Types

1. **Authentication Errors**: Invalid credentials, expired sessions
2. **Database Errors**: Connection issues, RLS violations
3. **AI Service Errors**: OpenAI API failures, rate limits
4. **Voice Service Errors**: Browser compatibility, permission issues
5. **Network Errors**: Connectivity problems

### Error Handling Strategy

```typescript
// Global error handling
try {
  // Operation
} catch (error) {
  if (error instanceof DatabaseError) {
    // Handle database errors
    console.error('Database error:', error)
    setDbError(error.message)
  } else if (error instanceof OpenAIError) {
    // Handle AI service errors
    console.error('OpenAI error:', error)
    showToast('AI service temporarily unavailable')
  } else {
    // Handle generic errors
    console.error('Unexpected error:', error)
    showToast('Something went wrong. Please try again.')
  }
}
```

### User-Friendly Error Messages

- **Database Setup**: Clear instructions for running migrations
- **AI Service**: Graceful degradation with fallback responses
- **Voice Services**: Browser compatibility warnings
- **Authentication**: Clear sign-in prompts

### Error Recovery

1. **Automatic Retries**: Exponential backoff for transient failures
2. **Graceful Degradation**: Fallback to text-only mode if voice fails
3. **Session Recovery**: Automatic session restoration on page reload
4. **Data Persistence**: Local storage for critical data

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Components loaded on demand
2. **Memoization**: React.memo for expensive components
3. **Debouncing**: Input handling to reduce API calls
4. **Caching**: Session data and AI responses
5. **Bundle Optimization**: Code splitting and tree shaking

### Monitoring

- **Session Duration**: Track user engagement
- **AI Response Time**: Monitor OpenAI API performance
- **Error Rates**: Track and alert on failures
- **Voice Recognition Accuracy**: Monitor voice input quality

## Security Considerations

### Data Protection

- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: Row Level Security (RLS) policies
- **Input Validation**: Sanitize all user inputs
- **API Key Management**: Secure storage of sensitive keys

### Privacy Compliance

- **GDPR**: Right to be forgotten, data portability
- **HIPAA**: Healthcare data protection (if applicable)
- **Consent Management**: Clear user consent for data collection
- **Data Retention**: Automatic cleanup of old data

## Testing

### Test Coverage

1. **Unit Tests**: Component and utility function testing
2. **Integration Tests**: API and database interaction testing
3. **E2E Tests**: Complete user flow testing
4. **Voice Testing**: Speech recognition and synthesis testing

### Test Environment

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## Deployment

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `OPENAI_API_KEY` | OpenAI API key | Yes | `sk-...` |
| `NEXT_PUBLIC_APP_URL` | Application URL | No | `https://fit4life.app` |

### Build Process

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Start production server
pnpm start
```

### Deployment Platforms

1. **Vercel**: Recommended for Next.js applications
2. **Netlify**: Alternative deployment option
3. **AWS**: Custom deployment with Docker
4. **Self-hosted**: Manual deployment with Node.js

---

This API documentation provides a comprehensive overview of the Fit4Life application architecture and implementation details. For specific implementation questions, refer to the source code or create an issue in the repository.
