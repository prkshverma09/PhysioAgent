"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MessageSquare } from "lucide-react"

interface AnimatedBlobProps {
  onStartConversation: (method: "voice" | "text") => void
}

export function AnimatedBlob({ onStartConversation }: AnimatedBlobProps) {
  const [isListening, setIsListening] = useState(false)

  const handleVoiceInput = () => {
    setIsListening(!isListening)
    // Placeholder for speech recognition
    setTimeout(() => {
      setIsListening(false)
      onStartConversation("voice")
    }, 2000)
  }

  const handleTextInput = () => {
    onStartConversation("text")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      {/* Animated Blob */}
      <div className="relative mb-8">
        <div
          className={`w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/30 rounded-full 
            ${isListening ? "animate-pulse" : "animate-bounce"} 
            transition-all duration-1000 ease-in-out`}
          style={{
            animation: isListening ? "pulse 1s ease-in-out infinite" : "gentle-breathe 3s ease-in-out infinite",
          }}
        >
          <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              {isListening ? (
                <div className="w-8 h-8 bg-accent rounded-full animate-ping" />
              ) : (
                <div className="w-6 h-6 bg-primary rounded-full" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="max-w-md mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4 text-balance">Hello! I'm your Virtual Physio Agent</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          I'm here to help you with your physiotherapy needs. Let's start by talking about how you're feeling today.
        </p>
      </div>

      {/* Interaction Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleVoiceInput}
          size="lg"
          className="flex items-center gap-2 px-6 py-3"
          disabled={isListening}
        >
          <Mic className="w-5 h-5" />
          {isListening ? "Listening..." : "Speak to me"}
        </Button>

        <Button
          onClick={handleTextInput}
          variant="outline"
          size="lg"
          className="flex items-center gap-2 px-6 py-3 bg-transparent"
        >
          <MessageSquare className="w-5 h-5" />
          Type instead
        </Button>
      </div>

      {/* Breathing Animation Keyframes */}
      <style jsx>{`
        @keyframes gentle-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
