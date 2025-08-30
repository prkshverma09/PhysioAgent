"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePatientSession } from "@/hooks/use-patient-session"
import { AnimatedBlob } from "@/components/animated-blob"
import { ConversationInterface } from "@/components/conversation-interface"
import { ExerciseDemo } from "@/components/exercise-demo"
import { BookingConfirmation } from "@/components/booking-confirmation"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

type AppState = "blob" | "conversation" | "exercise" | "booking"

export default function Fit4LifePage() {
  const [currentState, setCurrentState] = useState<AppState>("blob")
  const [userFeedback, setUserFeedback] = useState<string>("")
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const { currentSession, startSession, endSession, logInteraction, updateSession } = usePatientSession()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    return () => {
      if (currentSession) {
        endSession()
      }
    }
  }, [currentSession, endSession])

  const handleSignOut = async () => {
    if (currentSession) {
      await endSession()
    }
    await supabase.auth.signOut()
    // The auth state change will trigger the redirect in useEffect
  }

  const handleStartConversation = async (method: "voice" | "text") => {
    try {
      setDbError(null)
      await startSession()
      await logInteraction("conversation_start", { method })
      setCurrentState("conversation")
    } catch (error) {
      console.error("Failed to start session:", error)
      if (error instanceof Error && error.message.includes("Database setup required")) {
        setDbError(
          "Database tables need to be created. Please run the SQL migration script in your Supabase dashboard.",
        )
      } else {
        setDbError("Failed to start session. The app will continue without session tracking.")
      }
      setCurrentState("conversation")
    }
  }

  const handleShowExercise = async () => {
    await logInteraction("exercise_start", { from_state: "conversation" })
    setCurrentState("exercise")
  }

  const handleExerciseFeedback = async (feedback: string) => {
    setUserFeedback(feedback)

    await logInteraction("exercise_feedback", { feedback })
    await updateSession({
      completed_exercise: true,
      exercise_feedback: feedback,
      pain_level_after: feedback === "better" ? 3 : 7, // Mock pain levels
    })

    if (feedback === "better") {
      await endSession({
        completedExercise: true,
        exerciseFeedback: feedback,
        painLevelAfter: 3,
      })
      setTimeout(() => setCurrentState("blob"), 3000)
    } else {
      await logInteraction("booking_flow_start", { reason: "pain_persists" })
      setCurrentState("booking")
    }
  }

  const handleBookingComplete = async () => {
    const mockBookingId = `NHS-${Date.now()}`
    await logInteraction("booking_complete", { booking_id: mockBookingId })
    await endSession({
      completedExercise: true,
      exerciseFeedback: userFeedback,
      bookingRequested: true,
      bookingId: mockBookingId,
    })
    setCurrentState("blob")
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Fit4Life</h1>
            <p className="text-sm text-muted-foreground">Virtual Physio Agent</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.first_name || user?.email}
            </span>
            {currentSession && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Session Active</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Database Error Notification */}
      {dbError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Database Setup Required:</strong> {dbError}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Run the script:{" "}
                <code className="bg-yellow-100 px-1 rounded">scripts/001_create_patient_tables.sql</code>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-yellow-700 border-yellow-300 hover:bg-yellow-100 bg-transparent"
                onClick={() => setDbError(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentState === "blob" && <AnimatedBlob onStartConversation={handleStartConversation} />}

        {currentState === "conversation" && <ConversationInterface onShowExercise={handleShowExercise} />}

        {currentState === "exercise" && <ExerciseDemo onFeedback={handleExerciseFeedback} />}

        {currentState === "booking" && <BookingConfirmation onComplete={handleBookingComplete} />}

        {userFeedback === "better" && currentState === "blob" && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card p-8 rounded-lg border border-border text-center max-w-md">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Great Progress!</h3>
              <p className="text-muted-foreground">We're glad you're feeling better. Keep up the good work!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
