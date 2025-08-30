export interface Patient {
  id: string
  first_name?: string
  last_name?: string
  date_of_birth?: string
  phone?: string
  medical_conditions?: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
  created_at: string
  updated_at: string
}

export interface PatientSession {
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

export interface PatientInteraction {
  id: string
  session_id: string
  interaction_type: string
  interaction_data?: any
  timestamp: string
}
