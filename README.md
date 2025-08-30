# Fit4Life - AI-Powered Virtual Physiotherapy Assistant

Fit4Life is an advanced AI-powered virtual physiotherapy assistant that provides personalized rehabilitation guidance, exercise recommendations, and real-time voice interaction capabilities similar to ChatGPT's voice feature.

## 🚀 Features

### 🤖 AI-Powered Conversations
- **Intelligent Responses**: Powered by OpenAI GPT-4 for natural, contextual conversations
- **Pain Assessment**: Automatically extracts pain levels (1-10) and locations from user input
- **Personalized Guidance**: Provides tailored exercise recommendations based on patient information
- **Context Awareness**: Maintains conversation history for coherent, personalized responses

### 🎤 Voice Interaction
- **Speech-to-Text**: Real-time voice input with confidence scoring
- **Text-to-Speech**: Natural voice responses with customizable settings
- **Voice Controls**: Intuitive microphone and speaker controls
- **Voice Settings**: Adjustable speech rate, pitch, volume, and voice selection
- **Visual Feedback**: Real-time voice input visualization with confidence indicators

### 📊 Patient Management
- **Session Tracking**: Comprehensive logging of patient interactions and progress
- **Pain Monitoring**: Track pain levels and locations over time
- **Exercise Recommendations**: AI-generated exercise suggestions based on patient needs
- **Progress Analytics**: Visual statistics and progress tracking

### 🏥 UK NHS Integration
- **NHS Standards**: Built following UK NHS physiotherapy guidelines
- **Wait Time Awareness**: Educates patients about NHS waiting times and alternatives
- **Professional Guidance**: Recommends when to seek professional medical help

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **AI Integration**: OpenAI GPT-4 API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Voice Services**: Web Speech API (SpeechRecognition & SpeechSynthesis)
- **Deployment**: Vercel-ready

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- OpenAI API key
- Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fit4life
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Database Setup**
   Run the SQL migration to create required tables:
   ```sql
   -- Run scripts/001_create_patient_tables.sql in your Supabase SQL editor
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

6. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000)

## 🎤 Voice Features Guide

### Using Voice Input
1. **Start Listening**: Click the microphone button to begin voice input
2. **Speak Naturally**: Describe your pain, symptoms, or ask questions
3. **Real-time Feedback**: See your speech transcribed in real-time
4. **Confidence Scoring**: View confidence levels for voice recognition accuracy

### Voice Settings
- **Voice Selection**: Choose from available system voices
- **Speech Rate**: Adjust how fast the AI speaks (0.5x - 2.0x)
- **Pitch**: Modify voice pitch (0.5x - 2.0x)
- **Volume**: Control speech volume (0% - 100%)

### Voice Controls
- **Microphone**: Start/stop voice input
- **Speaker**: Play/pause/stop AI responses
- **Settings**: Access voice customization options

## 🤖 AI Conversation Flow

### Initial Assessment
1. **Welcome Message**: AI introduces itself and explains capabilities
2. **Pain Assessment**: User describes pain level and location
3. **Information Extraction**: AI automatically extracts pain data
4. **Context Building**: AI builds patient profile for personalized responses

### Ongoing Support
1. **Natural Conversations**: Users can ask questions, describe symptoms
2. **Exercise Recommendations**: AI suggests appropriate exercises
3. **Progress Tracking**: Session data is logged for future reference
4. **Safety Guidance**: AI recommends professional help when needed

## 📁 Project Structure

```
fit4life/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── conversation-interface.tsx  # Main chat interface
│   ├── voice-controls.tsx # Voice interaction controls
│   └── voice-message.tsx  # Voice message display
├── hooks/                 # Custom React hooks
│   └── use-patient-session.ts
├── lib/                   # Utility libraries
│   ├── openai.ts         # OpenAI integration
│   ├── voice-services.ts # Voice API services
│   └── supabase/         # Supabase client
├── scripts/               # Database migrations
└── types/                 # TypeScript type definitions
```

## 🔧 Configuration

### OpenAI API Setup
1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add to `.env.local`: `OPENAI_API_KEY=your_key_here`
3. The app uses GPT-4 for intelligent responses

### Supabase Setup
1. Create a new Supabase project
2. Run the database migration script
3. Add project URL and anon key to `.env.local`

### Voice API Support
- **Supported Browsers**: Chrome, Safari, Edge (latest versions)
- **Requirements**: HTTPS for production, microphone permissions
- **Fallback**: Text input available when voice is not supported

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## 🔒 Security & Privacy

- **Data Encryption**: All data encrypted in transit and at rest
- **Patient Privacy**: HIPAA-compliant data handling
- **API Security**: Secure API key management
- **Voice Data**: No voice data stored permanently
- **Session Management**: Secure session handling

## 🧪 Testing

### Voice Features Testing
```bash
# Test voice recognition
1. Click microphone button
2. Speak clearly into microphone
3. Verify transcription accuracy

# Test voice synthesis
1. Send a message to AI
2. Verify AI response is spoken
3. Test voice settings adjustments
```

### AI Response Testing
```bash
# Test pain assessment
1. Say "I have neck pain, level 7"
2. Verify pain level and location extraction
3. Check AI response appropriateness

# Test exercise recommendations
1. Ask for exercise suggestions
2. Verify AI provides safe, appropriate exercises
3. Check for safety warnings
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in `/docs`
- Review the troubleshooting guide

## 🔮 Future Enhancements

- **Multi-language Support**: Additional language support for voice
- **Video Integration**: Exercise demonstration videos
- **Wearable Integration**: Connect with fitness trackers
- **Telemedicine Integration**: Direct connection to healthcare providers
- **Advanced Analytics**: Detailed patient progress tracking
- **Mobile App**: Native iOS and Android applications

---

**Fit4Life** - Empowering patients with AI-driven physiotherapy guidance 🏥🤖
