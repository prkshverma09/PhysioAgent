"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Pause, 
  Square
} from 'lucide-react'
import { voiceServices, VoiceSettings, SpeechRecognitionResult } from '@/lib/voice-services'

interface VoiceControlsProps {
  onTranscriptUpdate: (result: SpeechRecognitionResult) => void
  onSpeakText: (text: string) => void
  isSpeaking: boolean
  isListening: boolean
  currentText?: string
  step?: number
}

export function VoiceControls({ 
  onTranscriptUpdate, 
  onSpeakText, 
  isSpeaking, 
  isListening,
  currentText,
  step = 0
}: VoiceControlsProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  })
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if voice services are supported
    setIsSupported(voiceServices.isSupported())
    
    if (voiceServices.isSupported()) {
      // Load available voices
      const loadVoices = () => {
        const voices = voiceServices.getAvailableVoices()
        setAvailableVoices(voices)
        
        // Set default voice if not already set
        if (!voiceSettings.voice && voices.length > 0) {
          const defaultVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            voice.name.toLowerCase().includes('female')
          ) || voices[0]
          
          setVoiceSettings(prev => ({
            ...prev,
            voice: defaultVoice?.name || ''
          }))
        }
      }

      // Load voices immediately and when they become available
      loadVoices()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  }, [])

  const handleMicToggle = () => {
    if (isListening) {
      voiceServices.stopListening()
    } else {
      voiceServices.startListening(onTranscriptUpdate)
    }
  }

  const handleSpeakToggle = () => {
    if (isSpeaking) {
      voiceServices.stopSpeaking()
    } else if (currentText) {
      voiceServices.speak(currentText, voiceSettings)
    }
  }

  const handlePauseResume = () => {
    if (voiceServices.isSpeakingActive()) {
      voiceServices.pauseSpeaking()
    } else {
      voiceServices.resumeSpeaking()
    }
  }

  const handleStop = () => {
    voiceServices.stopSpeaking()
  }

  const handleVoiceChange = (voiceName: string) => {
    setVoiceSettings(prev => ({ ...prev, voice: voiceName }))
  }

  const handleRateChange = (value: number[]) => {
    setVoiceSettings(prev => ({ ...prev, rate: value[0] }))
  }

  const handlePitchChange = (value: number[]) => {
    setVoiceSettings(prev => ({ ...prev, pitch: value[0] }))
  }

  const handleVolumeChange = (value: number[]) => {
    setVoiceSettings(prev => ({ ...prev, volume: value[0] }))
  }

  if (!isSupported) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <MicOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Voice features are not supported in your browser</p>
            <p className="text-xs mt-1">Try using Chrome, Safari, or Edge</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Voice Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Microphone Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleMicToggle}
              variant={isListening ? "destructive" : "default"}
              size="lg"
              className="flex-1"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
            
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="icon"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Speech Controls */}
          {currentText && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSpeakToggle}
                variant={isSpeaking ? "destructive" : "default"}
                size="sm"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Speak
                  </>
                )}
              </Button>
              
              {isSpeaking && (
                <>
                  <Button
                    onClick={handlePauseResume}
                    variant="outline"
                    size="sm"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    size="sm"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Voice Status */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
              {isListening ? 'Listening...' : 'Microphone ready'}
            </div>
            
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              {isSpeaking ? 'Speaking...' : 'Speaker ready'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Voice Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <Select value={voiceSettings.voice} onValueChange={handleVoiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speech Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Speech Rate</label>
              <Slider
                value={[voiceSettings.rate]}
                onValueChange={handleRateChange}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slow</span>
                <span>{voiceSettings.rate.toFixed(1)}x</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pitch</label>
              <Slider
                value={[voiceSettings.pitch]}
                onValueChange={handlePitchChange}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>{voiceSettings.pitch.toFixed(1)}x</span>
                <span>High</span>
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Volume</label>
              <Slider
                value={[voiceSettings.volume]}
                onValueChange={handleVolumeChange}
                min={0.0}
                max={1.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mute</span>
                <span>{Math.round(voiceSettings.volume * 100)}%</span>
                <span>Full</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
