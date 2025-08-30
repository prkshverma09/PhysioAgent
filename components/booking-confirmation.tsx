"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, Mail, Phone, MapPin, Clock, FileText } from "lucide-react"
import { usePatientSession } from "@/hooks/use-patient-session"

interface BookingConfirmationProps {
  onComplete: () => void
}

export function BookingConfirmation({ onComplete }: BookingConfirmationProps) {
  const [bookingId] = useState(() => `NHS-${Date.now().toString().slice(-6)}`)
  const [appointmentDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14) // 2 weeks from now
    return date
  })
  const [emailSent, setEmailSent] = useState(false)

  const { logInteraction, updateSession } = usePatientSession()

  useEffect(() => {
    // Log booking confirmation view and update session
    const initializeBooking = async () => {
      await logInteraction("booking_confirmation_view", {
        booking_id: bookingId,
        appointment_date: appointmentDate.toISOString(),
        timestamp: new Date().toISOString(),
      })

      await updateSession({
        booking_requested: true,
        booking_id: bookingId,
      })

      // Simulate email sending
      setTimeout(async () => {
        setEmailSent(true)
        await logInteraction("booking_email_sent", {
          booking_id: bookingId,
          email_sent_time: new Date().toISOString(),
        })
      }, 2000)
    }

    initializeBooking()
  }, [bookingId, appointmentDate, logInteraction, updateSession])

  const handleAddToCalendar = async () => {
    await logInteraction("add_to_calendar", {
      booking_id: bookingId,
      appointment_date: appointmentDate.toISOString(),
      action_time: new Date().toISOString(),
    })

    // Create calendar event data
    const eventData = {
      title: "NHS Physiotherapy Appointment",
      start: appointmentDate.toISOString(),
      end: new Date(appointmentDate.getTime() + 45 * 60000).toISOString(), // 45 minutes
      description: `Booking Reference: ${bookingId}\nLocation: NHS Physiotherapy Centre, 123 Health Street, London, SW1A 1AA`,
    }

    // Create calendar URL (Google Calendar format)
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${eventData.start.replace(/[-:]/g, "").split(".")[0]}Z/${eventData.end.replace(/[-:]/g, "").split(".")[0]}Z&details=${encodeURIComponent(eventData.description)}`

    window.open(calendarUrl, "_blank")
  }

  const handleResourceClick = async (resourceType: string, resourceName: string) => {
    await logInteraction("resource_access", {
      resource_type: resourceType,
      resource_name: resourceName,
      booking_id: bookingId,
      timestamp: new Date().toISOString(),
    })
  }

  const handleComplete = async () => {
    await logInteraction("booking_flow_complete", {
      booking_id: bookingId,
      completion_time: new Date().toISOString(),
      email_confirmed: emailSent,
    })
    onComplete()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed</h2>
        <p className="text-muted-foreground text-lg">Your physiotherapy appointment has been successfully scheduled</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Details */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Booking Reference:</span>
              <Badge variant="secondary" className="font-mono">
                {bookingId}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {appointmentDate.toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">10:30 AM - 11:15 AM</p>
                  <p className="text-sm text-muted-foreground">45 minute appointment</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">NHS Physiotherapy Centre</p>
                  <p className="text-sm text-muted-foreground">123 Health Street, London, SW1A 1AA</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">What to bring:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• NHS number or ID</li>
                <li>• Comfortable clothing</li>
                <li>• List of current medications</li>
                <li>• Any relevant medical reports</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Resources */}
        <div className="space-y-6">
          {/* Email Confirmation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-accent" />
                Email Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  emailSent ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                }`}
              >
                {emailSent ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <div className="w-5 h-5 border-2 border-yellow-600 rounded-full animate-spin mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${emailSent ? "text-green-900" : "text-yellow-900"}`}>
                    {emailSent ? "Confirmation email sent" : "Sending confirmation email..."}
                  </p>
                  <p className={`text-sm ${emailSent ? "text-green-700" : "text-yellow-700"}`}>
                    {emailSent
                      ? "Check your inbox for appointment details and preparation instructions"
                      : "Please wait while we send your confirmation"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">NHS Booking Line</p>
                  <p className="text-sm text-muted-foreground">0300 123 1234</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">physio.bookings@nhs.uk</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Online Portal</p>
                  <p className="text-sm text-muted-foreground">Manage appointments at nhs.uk/appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Helpful Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Helpful Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button
                  onClick={() => handleResourceClick("exercise", "pre-appointment-exercises")}
                  className="block w-full text-left p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-primary">Pre-appointment exercises</p>
                  <p className="text-sm text-muted-foreground">Gentle exercises to do before your visit</p>
                </button>

                <button
                  onClick={() => handleResourceClick("guide", "pain-management-tips")}
                  className="block w-full text-left p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-primary">Pain management tips</p>
                  <p className="text-sm text-muted-foreground">Ways to manage discomfort at home</p>
                </button>

                <button
                  onClick={() => handleResourceClick("guide", "nhs-physiotherapy-guide")}
                  className="block w-full text-left p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-primary">NHS Physiotherapy Guide</p>
                  <p className="text-sm text-muted-foreground">What to expect from your treatment</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Button onClick={handleComplete} size="lg" className="px-8">
          Return to Home
        </Button>
        <Button onClick={handleAddToCalendar} variant="outline" size="lg" className="px-8 bg-transparent">
          Add to Calendar
        </Button>
      </div>
    </div>
  )
}
