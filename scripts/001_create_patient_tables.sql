-- Create patients table to store patient information
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  medical_conditions TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patient_sessions table to track app usage sessions
CREATE TABLE IF NOT EXISTS public.patient_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  pain_level_initial INTEGER CHECK (pain_level_initial >= 1 AND pain_level_initial <= 10),
  pain_location TEXT,
  symptoms TEXT[],
  completed_exercise BOOLEAN DEFAULT FALSE,
  exercise_feedback TEXT,
  pain_level_after INTEGER CHECK (pain_level_after >= 1 AND pain_level_after <= 10),
  booking_requested BOOLEAN DEFAULT FALSE,
  booking_id TEXT,
  session_data JSONB -- Store conversation data, voice inputs, etc.
);

-- Create patient_interactions table to store all user interactions
CREATE TABLE IF NOT EXISTS public.patient_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.patient_sessions(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'voice', 'text', 'button_click', 'exercise_start', etc.
  interaction_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patients table
CREATE POLICY "patients_select_own" ON public.patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "patients_insert_own" ON public.patients FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "patients_update_own" ON public.patients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "patients_delete_own" ON public.patients FOR DELETE USING (auth.uid() = id);

-- Create RLS policies for patient_sessions table
CREATE POLICY "sessions_select_own" ON public.patient_sessions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "sessions_insert_own" ON public.patient_sessions FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "sessions_update_own" ON public.patient_sessions FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "sessions_delete_own" ON public.patient_sessions FOR DELETE USING (auth.uid() = patient_id);

-- Create RLS policies for patient_interactions table
CREATE POLICY "interactions_select_own" ON public.patient_interactions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.patient_sessions ps 
    WHERE ps.id = session_id AND ps.patient_id = auth.uid()
  ));
CREATE POLICY "interactions_insert_own" ON public.patient_interactions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.patient_sessions ps 
    WHERE ps.id = session_id AND ps.patient_id = auth.uid()
  ));

-- Create trigger to auto-create patient profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.patients (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_patient();
