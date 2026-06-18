"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const validatePassword = (pwd: string) => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters with uppercase and numbers")
      return
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions")
      return
    }

    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Registration failed")
      }

      const data = await response.json()

      // Store tokens
      localStorage.setItem("rs_token", data.access_token)
      localStorage.setItem("rs_refresh_token", data.refresh_token)
      if (data.user) {
        localStorage.setItem("rs_user_id", String(data.user.id))
        localStorage.setItem("rs_user_email", data.user.email)
      }

      // Redirect to onboarding
      router.push("/onboarding")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const isPasswordValid = password.length > 0 && validatePassword(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Get Started</CardTitle>
          <CardDescription>
            Create your Rent Scout account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <div className="text-xs space-y-1">
                <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : 'text-slate-400'}`}>
                  <Check className="h-3 w-3" />
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-slate-400'}`}>
                  <Check className="h-3 w-3" />
                  One uppercase letter
                </div>
                <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-slate-400'}`}>
                  <Check className="h-3 w-3" />
                  One number
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              {confirmPassword && (
                <div className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? "✓ Passwords match" : "✗ Passwords don't match"}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                disabled={loading}
              />
              <label
                htmlFor="terms"
                className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline dark:text-blue-400">
                  terms and conditions
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isPasswordValid || !passwordsMatch || !acceptTerms}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/auth" className="text-blue-600 hover:underline dark:text-blue-400">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
