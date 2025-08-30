"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Volume2, Waveform } from 'lucide-react'
import { SpeechRecognitionResult } from '@/lib/voice-services'

interface VoiceMessageProps {
  result: SpeechRecognitionResult
  isListening: boolean
  isSpeaking: boolean
}

export function VoiceMessage({ result, isListening, isSpeaking }: VoiceMessageProps) {
  const { transcript, confidence, isFinal } = result

  if (!transcript) return null

  return (
    <Card className={`mb-4 transition-all duration-300 ${
      isFinal ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Voice Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isListening ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {isListening ? (
              <Mic className="w-4 h-4 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">
                {isListening ? 'Listening...' : 'Voice Input'}
              </span>
              
              {/* Confidence Indicator */}
              {isFinal && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs text-gray-500">
                    {Math.round(confidence * 100)}% confidence
                  </span>
                </div>
              )}
              
              {/* Status Indicator */}
              {!isFinal && (
                <div className="flex items-center gap-1">
                  <Waveform className="w-3 h-3 text-blue-500 animate-pulse" />
                  <span className="text-xs text-blue-500">Processing...</span>
                </div>
              )}
            </div>

            {/* Transcript */}
            <p className={`text-sm leading-relaxed ${
              isFinal ? 'text-gray-800' : 'text-blue-700'
            }`}>
              {transcript}
            </p>

            {/* Visual Feedback */}
            {!isFinal && (
              <div className="mt-2 flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Volume2 className="w-4 h-4" />
              <span>Speaking response...</span>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-3 bg-green-400 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Component for displaying voice input suggestions
export function VoiceInputSuggestions({ 
  onSuggestionClick, 
  step = 0 
}: { 
  onSuggestionClick: (text: string) => void
  step?: number 
}) {
  const suggestions = [
    "I have neck pain, level 7",
    "My back hurts when I sit for long periods",
    "I need exercises for my shoulder",
    "What can I do for knee pain?",
    "I'm feeling better today"
  ]

  return (
    <div className="mb-4">
      <p className="text-sm text-muted-foreground mb-2">Try saying:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

// Component for voice status indicator
export function VoiceStatusIndicator({ 
  isListening, 
  isSpeaking, 
  isSupported 
}: { 
  isListening: boolean
  isSpeaking: boolean
  isSupported: boolean 
}) {
  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MicOff className="w-4 h-4" />
        <span>Voice features not supported</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
        <span className={isListening ? 'text-red-600' : 'text-muted-foreground'}>
          {isListening ? 'Listening' : 'Ready'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        <span className={isSpeaking ? 'text-green-600' : 'text-muted-foreground'}>
          {isSpeaking ? 'Speaking' : 'Ready'}
        </span>
      </div>
    </div>
  )
}
