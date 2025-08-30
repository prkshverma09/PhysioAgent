"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Users, Clock, TrendingUp, Mic, Volume2 } from "lucide-react"
import { usePatientSession } from "@/hooks/use-patient-session"
import { 
  generatePhysioResponse, 
  generateExerciseRecommendation,
  extractPainInfo,
  isOpenAIAvailable,
  type ConversationContext,
  type PhysioResponse 
} from "@/lib/openai"
import { voiceServices, type SpeechRecognitionResult } from "@/lib/voice-services"
import { VoiceControls } from "@/components/voice-controls"
import { VoiceMessage, VoiceInputSuggestions, VoiceStatusIndicator } from "@/components/voice-message"

interface ConversationInterfaceProps {
  onShowExercise: () => void
}

interface Message {
  id: string
  text: string
  sender: "agent" | "user"
  timestamp: Date
  isVoice?: boolean
  confidence?: number
}

export function ConversationInterface({ onShowExercise }: ConversationInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [showStats, setShowStats] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [painLevel, setPainLevel] = useState<number | null>(null)
  const [painLocation, setPainLocation] = useState<string>("")
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentVoiceResult, setCurrentVoiceResult] = useState<SpeechRecognitionResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)

  const { logInteraction, updateSession } = usePatientSession()

  // Initialize voice services
  useEffect(() => {
    setVoiceSupported(voiceServices.isSupported())
  }, [])

  // Start conversation with welcome message
  useEffect(() => {
    const timer = setTimeout(() => {
      const isAIEnabled = isOpenAIAvailable();
      const welcomeMessage = isAIEnabled 
        ? "Hello! I'm Fit4Life, your AI physiotherapy assistant. I can help you with pain assessment, exercise recommendations, and guidance. You can type or speak to me - just click the microphone button to start voice interaction."
        : "Hello! I'm Fit4Life, your physiotherapy assistant. I can help you with basic pain assessment and exercise guidance. For enhanced AI features, please add your OpenAI API key to the environment variables.";
      
      addMessage(welcomeMessage, "agent")
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const addMessage = async (text: string, sender: "agent" | "user", isVoice = false, confidence?: number) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      isVoice,
      confidence
    }
    setMessages((prev) => [...prev, newMessage])

    await logInteraction("message", {
      message: text,
      sender,
      timestamp: newMessage.timestamp.toISOString(),
      step: currentStep,
      isVoice,
      confidence
    })
  }

  const handleVoiceTranscript = useCallback((result: SpeechRecognitionResult) => {
    setCurrentVoiceResult(result)
    
    if (result.isFinal && result.transcript.trim()) {
      // Process the final transcript
      handleUserInput(result.transcript, true, result.confidence)
      setCurrentVoiceResult(null)
    }
  }, [currentStep, messages])

  const handleUserInput = async (text: string, isVoice = false, confidence?: number) => {
    if (!text.trim()) return

    setIsProcessing(true)
    
    // Add user message
    await addMessage(text, "user", isVoice, confidence)

    // Extract pain information
    const { painLevel: extractedPainLevel, painLocation: extractedLocation } = extractPainInfo(text)
    
    if (extractedPainLevel && currentStep === 0) {
      setPainLevel(extractedPainLevel)
      setPainLocation(extractedLocation || "unspecified")
      await updateSession({
        pain_level_initial: extractedPainLevel,
        pain_location: extractedLocation || "unspecified",
      })
    }

    // Build conversation context
    const context: ConversationContext = {
      messages: messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
        timestamp: msg.timestamp
      })),
      patientInfo: {
        painLevel: painLevel || extractedPainLevel || undefined,
        painLocation: painLocation || extractedLocation || undefined,
        sessionStart: new Date()
      },
      currentStep,
      sessionId: Date.now().toString()
    }

    try {
      // Generate AI response
      const response: PhysioResponse = await generatePhysioResponse(text, context)
      
      // Add AI response
      await addMessage(response.text, "agent", false)

      // Speak the response if enabled
      if (response.shouldSpeak && voiceSupported) {
        setIsSpeaking(true)
        try {
          await voiceServices.speak(response.text)
        } catch (error) {
          console.error('Speech synthesis error:', error)
        } finally {
          setIsSpeaking(false)
        }
      }

      // Update conversation step
      if (response.nextStep !== undefined && response.nextStep !== currentStep) {
        setCurrentStep(response.nextStep)
        
        if (response.nextStep === 1) {
          setShowStats(true)
        }
      }

      // Log conversation progress
      await logInteraction("conversation_progress", {
        step: response.nextStep || currentStep,
        pain_info_collected: { 
          painLevel: painLevel || extractedPainLevel, 
          painLocation: painLocation || extractedLocation 
        },
        ai_response: response.text,
        confidence: response.confidence
      })

    } catch (error) {
      console.error('Error generating response:', error)
      
      // Provide fallback response when AI is not available
      const fallbackResponse = isOpenAIAvailable() 
        ? "I'm having trouble processing that right now. Please try again."
        : "I understand your message. For more detailed AI responses, please add your OpenAI API key to enable enhanced features.";
      
      await addMessage(fallbackResponse, "agent")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return
    await handleUserInput(inputValue)
    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleVoiceSuggestion = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleShowExercise = async () => {
    await logInteraction("transition_to_exercise", {
      pain_level: painLevel,
      pain_location: painLocation,
      messages_exchanged: messages.length,
    })
    onShowExercise()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Voice Controls */}
      <VoiceControls
        onTranscriptUpdate={handleVoiceTranscript}
        onSpeakText={(text) => voiceServices.speak(text)}
        isSpeaking={isSpeaking}
        isListening={isListening}
        currentText={messages[messages.length - 1]?.text}
        step={currentStep}
      />

      {/* Voice Status */}
      <div className="mb-4">
        <VoiceStatusIndicator
          isListening={isListening}
          isSpeaking={isSpeaking}
          isSupported={voiceSupported}
        />
      </div>

      {/* Voice Input Suggestions */}
      {voiceSupported && currentStep === 0 && (
        <VoiceInputSuggestions onSuggestionClick={handleVoiceSuggestion} step={currentStep} />
      )}

      {/* Current Voice Input */}
      {currentVoiceResult && !currentVoiceResult.isFinal && (
        <VoiceMessage
          result={currentVoiceResult}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      )}

      {/* Chat Interface */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <div className={`w-3 h-3 rounded-full animate-pulse ${isOpenAIAvailable() ? 'bg-green-500' : 'bg-yellow-500'}`} />
            Fit4Life {isOpenAIAvailable() ? 'AI Assistant' : 'Assistant'}
            {painLevel && (
              <span className="text-sm text-muted-foreground ml-2">
                Pain Level: {painLevel}/10 {painLocation && `(${painLocation})`}
              </span>
            )}
            {!isOpenAIAvailable() && (
              <span className="text-xs text-yellow-600 ml-2 bg-yellow-100 px-2 py-1 rounded">
                Basic Mode
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    {message.isVoice && (
                      <Mic className="w-3 h-3 opacity-70" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs opacity-70">
                    <span>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                    </span>
                    {message.confidence && (
                      <span>{Math.round(message.confidence * 100)}% confidence</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                currentStep === 0 
                  ? "Describe your pain (e.g., 'I have neck pain, level 7')..." 
                  : "Type your message or use voice input..."
              }
              className="flex-1"
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSendMessage} 
              size="icon"
              disabled={isProcessing || !inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* UK Physiotherapy Stats */}
      {showStats && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">6.8M</p>
                  <p className="text-sm text-muted-foreground">Patients on NHS waiting lists</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold text-foreground">18 weeks</p>
                  <p className="text-sm text-muted-foreground">Average wait time for physio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">85%</p>
                  <p className="text-sm text-muted-foreground">Improvement with early intervention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Continue Button */}
      {currentStep >= 2 && (
        <div className="text-center">
          <Button onClick={handleShowExercise} size="lg" className="px-8">
            Let's try an exercise
          </Button>
        </div>
      )}
    </div>
  )
}
