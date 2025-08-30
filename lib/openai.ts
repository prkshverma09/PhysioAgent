import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn('OpenAI client initialization failed:', error);
}

export interface ConversationContext {
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

export interface PhysioResponse {
  text: string
  shouldSpeak: boolean
  suggestedActions?: string[]
  confidence: number
  nextStep?: number
}

export async function generatePhysioResponse(
  userMessage: string, 
  context: ConversationContext
): Promise<PhysioResponse> {
  // Check if OpenAI is available
  if (!openai) {
    return {
      text: "I'm currently offline. Please add your OpenAI API key to enable AI features. For now, I can help you with basic pain assessment and exercise guidance.",
      shouldSpeak: false,
      confidence: 0.0
    };
  }

  try {
    // Build conversation history for context
    const conversationHistory = context.messages
      .slice(-10) // Last 10 messages for context
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    const systemPrompt = `You are Fit4Life, a professional AI physiotherapy assistant. Your role is to:

1. **Assess and Understand**: Help patients describe their pain levels (1-10) and locations
2. **Educate**: Provide clear, simple explanations about physiotherapy concepts
3. **Guide**: Suggest appropriate exercises and self-care techniques
4. **Support**: Offer encouragement and motivation for recovery
5. **Safety**: Always recommend seeking professional help for severe or persistent issues

**Key Guidelines:**
- Be empathetic, professional, and encouraging
- Use simple, clear language suitable for voice interaction
- Focus on UK NHS physiotherapy standards
- Keep responses concise but informative (2-3 sentences for voice)
- Ask follow-up questions to gather more information
- Provide actionable advice when possible

**Current Context:**
- Patient pain level: ${context.patientInfo?.painLevel || 'Not assessed'}
- Pain location: ${context.patientInfo?.painLocation || 'Not specified'}
- Conversation step: ${context.currentStep || 0}
- Medical conditions: ${context.patientInfo?.medicalConditions?.join(', ') || 'None mentioned'}

**Response Format:**
Respond naturally as if having a conversation. Your response should be:
- Conversational and warm
- Appropriate for voice interaction
- Helpful and actionable
- Professional but approachable`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...conversationHistory,
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Could you please try again?";
    
    // Analyze response to determine if it should be spoken
    const shouldSpeak = !responseText.toLowerCase().includes('sorry') && 
                       responseText.length > 10 &&
                       !responseText.includes('error')

    // Determine next step based on conversation flow
    let nextStep = context.currentStep
    if (context.currentStep === 0 && context.patientInfo?.painLevel) {
      nextStep = 1
    } else if (context.currentStep === 1 && userMessage.toLowerCase().includes('exercise')) {
      nextStep = 2
    }

    return {
      text: responseText,
      shouldSpeak,
      confidence: completion.choices[0]?.finish_reason === 'stop' ? 0.9 : 0.7,
      nextStep
    }

  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      text: "I'm having trouble connecting right now. Please try again later.",
      shouldSpeak: false,
      confidence: 0.0
    };
  }
}

// Enhanced function for generating exercise recommendations
export async function generateExerciseRecommendation(
  painLevel: number,
  painLocation: string,
  context: ConversationContext
): Promise<PhysioResponse> {
  // Check if OpenAI is available
  if (!openai) {
    return {
      text: "I can help you with some exercises. Let's start with a gentle one.",
      shouldSpeak: true,
      confidence: 0.7
    };
  }

  try {
    const exercisePrompt = `Based on the patient's pain level ${painLevel}/10 and location "${painLocation}", suggest 1-2 appropriate exercises.

Guidelines:
- Pain level 1-3: Gentle stretching and mobility exercises
- Pain level 4-6: Moderate strengthening with proper form
- Pain level 7-10: Rest, gentle movement, and professional consultation

Location-specific considerations:
- Neck: Gentle neck stretches, shoulder rolls
- Back: Cat-cow stretches, gentle core exercises
- Shoulder: Range of motion exercises, wall slides
- Knee: Quad sets, gentle leg raises
- Hip: Hip flexor stretches, gentle squats

Provide:
1. Exercise name and description
2. How to perform it safely
3. Expected benefits
4. When to stop (pain increase, etc.)

Keep it conversational and encouraging.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: exercisePrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.6,
    });

    const responseText = completion.choices[0]?.message?.content || "I'll help you with some exercises. Let me show you a safe one to start with.";

    return {
      text: responseText,
      shouldSpeak: true,
      confidence: 0.9,
      nextStep: 2
    }

  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      text: "I can help you with some exercises. Let's start with a gentle one.",
      shouldSpeak: true,
      confidence: 0.7
    };
  }
}

// Helper function to check if OpenAI is available
export function isOpenAIAvailable(): boolean {
  return openai !== null;
}

// Function to analyze user input for pain information
export function extractPainInfo(userMessage: string): {
  painLevel: number | null
  painLocation: string | null
  confidence: number
} {
  const lowerMessage = userMessage.toLowerCase()
  
  // Extract pain level (1-10)
  const painLevelMatch = userMessage.match(/(?:pain level|level|pain)\s*(?:of\s*)?(\d{1,2})/i)
  const painLevel = painLevelMatch ? Number.parseInt(painLevelMatch[1]) : null
  
  // Extract pain location
  const locations = ['neck', 'back', 'shoulder', 'knee', 'hip', 'ankle', 'wrist', 'elbow']
  let painLocation = null
  let confidence = 0.5

  for (const location of locations) {
    if (lowerMessage.includes(location)) {
      painLocation = location
      confidence = 0.8
      break
    }
  }

  // If we found both pain level and location, increase confidence
  if (painLevel && painLocation) {
    confidence = 0.9
  }

  return { painLevel, painLocation, confidence }
}