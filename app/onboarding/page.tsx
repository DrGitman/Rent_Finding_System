"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Check, ChevronRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"

const UNIT_TYPES = [
  { id: "studio", label: "Studio" },
  { id: "1bed", label: "1 Bedroom" },
  { id: "2bed", label: "2 Bedrooms" },
  { id: "3bed", label: "3+ Bedrooms" },
]

const COMMON_NEIGHBORHOODS = [
  "Downtown",
  "Midtown",
  "Uptown",
  "Riverside",
  "Tech District",
  "Suburbs",
]

const SOURCES = [
  { id: "zillow", label: "Zillow" },
  { id: "apartments", label: "Apartments.com" },
  { id: "craigslist", label: "Craigslist" },
  { id: "airbnb", label: "Airbnb" },
  { id: "facebook", label: "Facebook Marketplace" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [budget, setBudget] = useState([500, 3000])
  const [city, setCity] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [radius, setRadius] = useState(5)
  const [selectedUnits, setSelectedUnits] = useState<string[]>(["1bed", "2bed"])
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [customNeighborhood, setCustomNeighborhood] = useState("")
  const [selectedSources, setSelectedSources] = useState<string[]>(["zillow"])
  const [notificationEmail, setNotificationEmail] = useState(true)
  const [notificationSms, setNotificationSms] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/auth")
    }
  }, [router])

  const handleToggleUnit = (unitId: string) => {
    setSelectedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    )
  }

  const handleToggleNeighborhood = (neighborhood: string) => {
    setSelectedNeighborhoods((prev) =>
      prev.includes(neighborhood) ? prev.filter((n) => n !== neighborhood) : [...prev, neighborhood]
    )
  }

  const handleToggleSource = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    )
  }

  const handleAddCustomNeighborhood = () => {
    if (customNeighborhood && !selectedNeighborhoods.includes(customNeighborhood)) {
      handleToggleNeighborhood(customNeighborhood)
      setCustomNeighborhood("")
    }
  }

  const handleNext = () => {
    if (validateStep()) {
      if (step < 5) {
        setStep(step + 1)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const validateStep = (): boolean => {
    setError("")
    switch (step) {
      case 1:
        if (!city) {
          setError("Please enter a city")
          return false
        }
        return true
      case 2:
        if (selectedUnits.length === 0) {
          setError("Please select at least one unit type")
          return false
        }
        return true
      case 3:
        if (selectedNeighborhoods.length === 0) {
          setError("Please select at least one neighborhood")
          return false
        }
        return true
      case 4:
        if (selectedSources.length === 0) {
          setError("Please select at least one source")
          return false
        }
        return true
      case 5:
        if (notificationSms && !phoneNumber) {
          setError("Please enter a phone number for SMS notifications")
          return false
        }
        return true
    }
    return true
  }

  const handleComplete = async () => {
    if (!validateStep()) return

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/users/profile/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          min_budget: budget[0],
          max_budget: budget[1],
          city,
          latitude: lat ? parseFloat(lat) : null,
          longitude: lng ? parseFloat(lng) : null,
          search_radius_km: radius,
          unit_types: selectedUnits,
          neighborhoods: selectedNeighborhoods,
          preferred_sources: selectedSources,
          notify_email: notificationEmail,
          notify_sms: notificationSms,
          notify_whatsapp: false,
          notify_push: true,
          phone_number: phoneNumber,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Failed to save preferences")
      }

      // Redirect to dashboard
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`h-2 flex-1 mx-1 rounded-full ${
                  num <= step
                    ? "bg-blue-600"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Step {step} of 5
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && "Where are you looking?"}
              {step === 2 && "What unit types interest you?"}
              {step === 3 && "Which neighborhoods?"}
              {step === 4 && "Preferred rental sources"}
              {step === 5 && "How do you want to be notified?"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Let's start by finding rentals in your area"}
              {step === 2 && "Select the types of units that work for you"}
              {step === 3 && "Pick neighborhoods you'd like to explore"}
              {step === 4 && "Choose where we should scan for listings"}
              {step === 5 && "Set up your notification preferences"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g., San Francisco"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude (optional)</Label>
                    <Input
                      id="latitude"
                      placeholder="37.7749"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude (optional)</Label>
                    <Input
                      id="longitude"
                      placeholder="-122.4194"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <Label>
                    Search Radius: {radius} km
                  </Label>
                  <Slider
                    value={[radius]}
                    onValueChange={(value) => setRadius(value[0])}
                    min={1}
                    max={50}
                    step={1}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Unit Types */}
            {step === 2 && (
              <div className="space-y-4">
                {UNIT_TYPES.map((unit) => (
                  <div key={unit.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={unit.id}
                      checked={selectedUnits.includes(unit.id)}
                      onCheckedChange={() => handleToggleUnit(unit.id)}
                      disabled={loading}
                    />
                    <Label htmlFor={unit.id} className="cursor-pointer">
                      {unit.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Neighborhoods */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {COMMON_NEIGHBORHOODS.map((neighborhood) => (
                    <div key={neighborhood} className="flex items-center space-x-3">
                      <Checkbox
                        id={neighborhood}
                        checked={selectedNeighborhoods.includes(neighborhood)}
                        onCheckedChange={() => handleToggleNeighborhood(neighborhood)}
                        disabled={loading}
                      />
                      <Label htmlFor={neighborhood} className="cursor-pointer">
                        {neighborhood}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <Label htmlFor="custom">Add custom neighborhood</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="custom"
                      placeholder="Enter neighborhood name"
                      value={customNeighborhood}
                      onChange={(e) => setCustomNeighborhood(e.target.value)}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      onClick={handleAddCustomNeighborhood}
                      disabled={!customNeighborhood || loading}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {selectedNeighborhoods.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedNeighborhoods.map((n) => (
                      <div
                        key={n}
                        className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {n}
                        <button
                          onClick={() => handleToggleNeighborhood(n)}
                          className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Budget & Sources */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>
                    Budget: ${budget[0]} - ${budget[1]} /month
                  </Label>
                  <Slider
                    value={budget}
                    onValueChange={(value) => setBudget([value[0], value[1]])}
                    min={0}
                    max={5000}
                    step={100}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Preferred sources</Label>
                  {SOURCES.map((source) => (
                    <div key={source.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={source.id}
                        checked={selectedSources.includes(source.id)}
                        onCheckedChange={() => handleToggleSource(source.id)}
                        disabled={loading}
                      />
                      <Label htmlFor={source.id} className="cursor-pointer">
                        {source.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Notifications */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="notify-email"
                    checked={notificationEmail}
                    onCheckedChange={(checked) => setNotificationEmail(checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="notify-email" className="cursor-pointer">
                    Email notifications
                  </Label>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="notify-sms"
                      checked={notificationSms}
                      onCheckedChange={(checked) => setNotificationSms(checked as boolean)}
                      disabled={loading}
                    />
                    <Label htmlFor="notify-sms" className="cursor-pointer">
                      SMS notifications
                    </Label>
                  </div>
                  {notificationSms && (
                    <Input
                      placeholder="Phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-6">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              {step < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
