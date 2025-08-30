"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, CheckCircle, AlertCircle } from "lucide-react"
import { usePatientSession } from "@/hooks/use-patient-session"

interface ExerciseDemoProps {
  onFeedback: (feedback: "better" | "pain") => void
}

export function ExerciseDemo({ onFeedback }: ExerciseDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [exerciseStartTime, setExerciseStartTime] = useState<Date | null>(null)
  const [exerciseCompletionTime, setExerciseCompletionTime] = useState<Date | null>(null)

  const { logInteraction } = usePatientSession()

  const exerciseSteps = [
    "Sit comfortably in a chair with your back straight",
    "Slowly turn your head to the right, hold for 5 seconds",
    "Return to center position",
    "Slowly turn your head to the left, hold for 5 seconds",
    "Return to center and repeat 5 times",
  ]

  const handlePlayPause = async () => {
    const newIsPlaying = !isPlaying
    setIsPlaying(newIsPlaying)

    if (newIsPlaying) {
      const startTime = new Date()
      setExerciseStartTime(startTime)
      await logInteraction("exercise_play", {
        action: "start",
        timestamp: startTime.toISOString(),
        exercise_type: "neck_mobility",
      })

      // Simulate exercise progression
      const interval = setInterval(async () => {
        setCurrentStep((prev) => {
          if (prev >= exerciseSteps.length - 1) {
            clearInterval(interval)
            setIsPlaying(false)
            setShowFeedback(true)
            const completionTime = new Date()
            setExerciseCompletionTime(completionTime)
            logInteraction("exercise_complete", {
              duration_seconds: Math.floor((completionTime.getTime() - startTime.getTime()) / 1000),
              steps_completed: exerciseSteps.length,
              completion_time: completionTime.toISOString(),
            })
            return prev
          }
          logInteraction("exercise_step", {
            step_number: prev + 1,
            step_description: exerciseSteps[prev + 1],
            timestamp: new Date().toISOString(),
          })
          return prev + 1
        })
      }, 3000)
    } else {
      await logInteraction("exercise_play", {
        action: "pause",
        current_step: currentStep,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const handleReset = async () => {
    setCurrentStep(0)
    setIsPlaying(false)
    setShowFeedback(false)
    setExerciseStartTime(null)
    setExerciseCompletionTime(null)

    await logInteraction("exercise_reset", {
      previous_step: currentStep,
      timestamp: new Date().toISOString(),
    })
  }

  const handleFeedback = async (feedback: "better" | "pain") => {
    const feedbackTime = new Date()
    const exerciseDuration =
      exerciseStartTime && exerciseCompletionTime
        ? Math.floor((exerciseCompletionTime.getTime() - exerciseStartTime.getTime()) / 1000)
        : null

    await logInteraction("exercise_feedback_detailed", {
      feedback,
      exercise_duration_seconds: exerciseDuration,
      steps_completed: currentStep + 1,
      total_steps: exerciseSteps.length,
      feedback_time: feedbackTime.toISOString(),
      exercise_type: "neck_mobility",
    })

    onFeedback(feedback)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Exercise Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Neck Mobility Exercise</h2>
        <p className="text-muted-foreground text-lg">
          This gentle exercise helps improve neck flexibility and reduce tension
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <Badge variant="secondary">Beginner Friendly</Badge>
          <Badge variant="outline">5 minutes</Badge>
          <Badge variant="outline">No equipment needed</Badge>
          {isPlaying && (
            <Badge variant="default">
              Step {currentStep + 1} of {exerciseSteps.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video/Animation Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Exercise Demonstration
              {exerciseStartTime && isPlaying && (
                <span className="text-sm text-muted-foreground ml-2">
                  {Math.floor((new Date().getTime() - exerciseStartTime.getTime()) / 1000)}s
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for exercise demonstration */}
            <div className="relative bg-muted rounded-lg aspect-video flex items-center justify-center mb-4">
              <img
                src="/person-doing-neck-stretches-physiotherapy-exercise.png"
                alt="Neck mobility exercise demonstration"
                className="w-full h-full object-cover rounded-lg"
              />

              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                <Button onClick={handlePlayPause} size="lg" className="rounded-full w-16 h-16" disabled={showFeedback}>
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
              </div>
            </div>

            {/* Exercise Controls */}
            <div className="flex justify-center gap-2">
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exerciseSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    index === currentStep && isPlaying
                      ? "bg-primary/10 border border-primary/20"
                      : index < currentStep
                        ? "bg-green-50 border border-green-200"
                        : "bg-muted/50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      index < currentStep
                        ? "bg-green-500 text-white"
                        : index === currentStep && isPlaying
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      index === currentStep && isPlaying ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </p>
                </div>
              ))}
            </div>

            {/* Safety Tips */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Safety Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Move slowly and gently</li>
                <li>• Stop if you feel sharp pain</li>
                <li>• Breathe normally throughout</li>
                <li>• Don't force any movement</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Section */}
      {showFeedback && (
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-4">How do you feel after the exercise?</h3>
            <p className="text-muted-foreground mb-6">
              Your feedback helps us provide better care and determine next steps
            </p>
            {exerciseStartTime && exerciseCompletionTime && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Exercise completed in{" "}
                  {Math.floor((exerciseCompletionTime.getTime() - exerciseStartTime.getTime()) / 60000)}m{" "}
                  {((exerciseCompletionTime.getTime() - exerciseStartTime.getTime()) / 1000) % 60}s
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => handleFeedback("better")}
                size="lg"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8"
              >
                <CheckCircle className="w-5 h-5" />I feel better
              </Button>

              <Button
                onClick={() => handleFeedback("pain")}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 px-8"
              >
                <AlertCircle className="w-5 h-5" />
                Still in pain
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
