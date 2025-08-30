export interface VoiceSettings {
  voice: string
  rate: number
  pitch: number
  volume: number
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

class VoiceServices {
  private speechRecognition: any = null
  private speechSynthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private isListening = false
  private isSpeaking = false
  private onTranscriptUpdate: ((result: SpeechRecognitionResult) => void) | null = null

  constructor() {
    this.initializeSpeechRecognition()
    this.initializeSpeechSynthesis()
  }

  private initializeSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        this.speechRecognition = new SpeechRecognition()
        this.speechRecognition.continuous = true
        this.speechRecognition.interimResults = true
        this.speechRecognition.lang = 'en-US'
        
        this.speechRecognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          if (this.onTranscriptUpdate) {
            this.onTranscriptUpdate({
              transcript: finalTranscript || interimTranscript,
              confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0,
              isFinal: finalTranscript.length > 0
            })
          }
        }

        this.speechRecognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          this.isListening = false
        }

        this.speechRecognition.onend = () => {
          this.isListening = false
        }
      }
    }
  }

  private initializeSpeechSynthesis() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis
    }
  }

  // Speech-to-Text Methods
  startListening(onTranscriptUpdate: (result: SpeechRecognitionResult) => void): boolean {
    if (!this.speechRecognition) {
      console.error('Speech recognition not supported')
      return false
    }

    if (this.isListening) {
      this.stopListening()
    }

    this.onTranscriptUpdate = onTranscriptUpdate
    this.isListening = true
    this.speechRecognition.start()
    return true
  }

  stopListening(): void {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop()
      this.isListening = false
      this.onTranscriptUpdate = null
    }
  }

  isListeningActive(): boolean {
    return this.isListening
  }

  // Text-to-Speech Methods
  speak(text: string, settings: Partial<VoiceSettings> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Stop any current speech
      this.stopSpeaking()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Apply voice settings
      utterance.voice = this.getVoice(settings.voice)
      utterance.rate = settings.rate || 1.0
      utterance.pitch = settings.pitch || 1.0
      utterance.volume = settings.volume || 1.0

      utterance.onstart = () => {
        this.isSpeaking = true
        this.currentUtterance = utterance
      }

      utterance.onend = () => {
        this.isSpeaking = false
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.isSpeaking = false
        this.currentUtterance = null
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      this.speechSynthesis.speak(utterance)
    })
  }

  stopSpeaking(): void {
    if (this.speechSynthesis && this.isSpeaking) {
      this.speechSynthesis.cancel()
      this.isSpeaking = false
      this.currentUtterance = null
    }
  }

  pauseSpeaking(): void {
    if (this.speechSynthesis && this.isSpeaking) {
      this.speechSynthesis.pause()
    }
  }

  resumeSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.resume()
    }
  }

  isSpeakingActive(): boolean {
    return this.isSpeaking
  }

  // Voice Management
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.speechSynthesis) return []
    return this.speechSynthesis.getVoices()
  }

  private getVoice(voiceName?: string): SpeechSynthesisVoice | null {
    if (!this.speechSynthesis) return null
    
    const voices = this.speechSynthesis.getVoices()
    if (voiceName) {
      return voices.find(voice => voice.name === voiceName) || null
    }
    
    // Default to a female English voice
    return voices.find(voice => 
      voice.lang.startsWith('en') && 
      voice.name.toLowerCase().includes('female')
    ) || voices[0] || null
  }

  // Utility Methods
  isSupported(): boolean {
    return !!(this.speechRecognition && this.speechSynthesis)
  }

  getCapabilities() {
    return {
      speechRecognition: !!this.speechRecognition,
      speechSynthesis: !!this.speechSynthesis,
      voices: this.getAvailableVoices().length
    }
  }
}

// Export singleton instance
export const voiceServices = new VoiceServices()
