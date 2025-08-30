"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { PatientSession } from "@/types/patient"

export function usePatientSession() {
  const [currentSession, setCurrentSession] = useState<PatientSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const checkDatabaseSetup = useCallback(async () => {
    try {
      // Try to query the patient_sessions table to check if it exists
      const { error } = await supabase.from("patient_sessions").select("id").limit(1)

      if (error && error.message.includes("does not exist")) {
        throw new Error(
          "Database tables not found. Please run the SQL script 'scripts/001_create_patient_tables.sql' in your Supabase dashboard to create the required tables.",
        )
      }

      if (error && !error.message.includes("does not exist")) {
        throw error
      }

      return true
    } catch (error) {
      throw error
    }
  }, [supabase])

  // Start a new session
  const startSession = useCallback(
    async (initialData?: {
      painLevel?: number
      painLocation?: string
      symptoms?: string[]
    }) => {
      setIsLoading(true)
      try {
        await checkDatabaseSetup()

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("User not authenticated")

        const sessionData = {
          patient_id: user.id,
          session_start: new Date().toISOString(),
          pain_level_initial: initialData?.painLevel,
          pain_location: initialData?.painLocation,
          symptoms: initialData?.symptoms,
          session_data: { started_via: "app_interaction" },
        }

        const { data, error } = await supabase.from("patient_sessions").insert(sessionData).select().single()

        if (error) throw error
        setCurrentSession(data)

        // Log session start interaction
        await logInteraction("session_start", {
          method: initialData ? "voice" : "text",
          initial_data: initialData,
        })

        return data
      } catch (error) {
        console.error("Error starting session:", error)
        if (error instanceof Error && error.message.includes("Database tables not found")) {
          throw new Error("Database setup required. Please run the database migration script first.")
        }
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [supabase, checkDatabaseSetup],
  )

  // End current session
  const endSession = useCallback(
    async (endData?: {
      completedExercise?: boolean
      exerciseFeedback?: string
      painLevelAfter?: number
      bookingRequested?: boolean
      bookingId?: string
    }) => {
      if (!currentSession) return

      try {
        const updateData = {
          session_end: new Date().toISOString(),
          completed_exercise: endData?.completedExercise || false,
          exercise_feedback: endData?.exerciseFeedback,
          pain_level_after: endData?.painLevelAfter,
          booking_requested: endData?.bookingRequested || false,
          booking_id: endData?.bookingId,
        }

        const { error } = await supabase.from("patient_sessions").update(updateData).eq("id", currentSession.id)

        if (error) throw error

        // Log session end interaction
        await logInteraction("session_end", endData)

        setCurrentSession(null)
      } catch (error) {
        console.error("Error ending session:", error)
        throw error
      }
    },
    [currentSession, supabase],
  )

  // Log individual interactions
  const logInteraction = useCallback(
    async (type: string, data?: any) => {
      if (!currentSession) return

      try {
        const interactionData = {
          session_id: currentSession.id,
          interaction_type: type,
          interaction_data: data,
          timestamp: new Date().toISOString(),
        }

        const { error } = await supabase.from("patient_interactions").insert(interactionData)

        if (error) throw error
      } catch (error) {
        console.error("Error logging interaction:", error)
      }
    },
    [currentSession, supabase],
  )

  // Update session data
  const updateSession = useCallback(
    async (updates: Partial<PatientSession>) => {
      if (!currentSession) return

      try {
        const { data, error } = await supabase
          .from("patient_sessions")
          .update(updates)
          .eq("id", currentSession.id)
          .select()
          .single()

        if (error) throw error
        setCurrentSession(data)
        return data
      } catch (error) {
        console.error("Error updating session:", error)
        throw error
      }
    },
    [currentSession, supabase],
  )

  return {
    currentSession,
    isLoading,
    startSession,
    endSession,
    logInteraction,
    updateSession,
  }
}
