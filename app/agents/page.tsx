"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Play, Pause, Trash2, Plus, TrendingUp, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Agent {
  id: number
  name: string
  description: string
  agent_type: string
  source: string
  status: string
  last_run: string | null
  next_run: string | null
  n8n_workflow_id: string | null
}

interface Activity {
  id: number
  activity_type: string
  status: string
  listings_processed: number
  scams_detected: number
  started_at: string
  completed_at: string | null
  error_log: string | null
}

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agent_type: "scanner",
    source: "zillow",
  })

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/auth")
      return
    }

    fetchAgents()
  }, [router])

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/agents/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch agents")

      const data = await response.json()
      setAgents(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents")
    } finally {
      setLoading(false)
    }
  }

  const fetchAgentActivities = async (agentId: number) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/agents/${agentId}/activities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch activities")

      const data = await response.json()
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activities")
    }
  }

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/agents/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          configuration: {},
        }),
      })

      if (!response.ok) throw new Error("Failed to create agent")

      await fetchAgents()
      setShowCreateDialog(false)
      setFormData({
        name: "",
        description: "",
        agent_type: "scanner",
        source: "zillow",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent")
    } finally {
      setLoading(false)
    }
  }

  const handleRunAgent = async (agentId: number) => {
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/agents/${agentId}/run-now`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to run agent")

      await fetchAgents()
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run agent")
    } finally {
      setLoading(false)
    }
  }

  const handlePauseAgent = async (agentId: number) => {
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/agents/${agentId}/pause`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to pause agent")

      await fetchAgents()
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause agent")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAgent = async (agentId: number) => {
    if (!confirm("Are you sure you want to delete this agent?")) return

    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/agents/${agentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete agent")

      await fetchAgents()
      setSelectedAgent(null)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete agent")
    } finally {
      setLoading(false)
    }
  }

  const handleViewActivities = (agent: Agent) => {
    setSelectedAgent(agent)
    fetchAgentActivities(agent.id)
    setShowActivityModal(true)
  }

  const getAgentIcon = (type: string) => {
    switch (type) {
      case "scanner":
        return <TrendingUp className="h-4 w-4" />
      case "evaluator":
        return <Zap className="h-4 w-4" />
      case "scam_detector":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getAgentTypeLabel = (type: string) => {
    switch (type) {
      case "scanner":
        return "Listing Scanner"
      case "evaluator":
        return "Evaluator"
      case "scam_detector":
        return "Scam Detector"
      default:
        return type
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your automated rental agents</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Set up a new AI agent to automate your rental search
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Downtown Scanner"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What does this agent do?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="agent_type">Agent Type</Label>
                <Select value={formData.agent_type} onValueChange={(value) => setFormData({ ...formData, agent_type: value })}>
                  <SelectTrigger id="agent_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scanner">Listing Scanner</SelectItem>
                    <SelectItem value="evaluator">Evaluator</SelectItem>
                    <SelectItem value="scam_detector">Scam Detector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zillow">Zillow</SelectItem>
                    <SelectItem value="apartments">Apartments.com</SelectItem>
                    <SelectItem value="craigslist">Craigslist</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Agent"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && agents.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">No agents yet. Create one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      {getAgentIcon(agent.agent_type)}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {agent.name}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          agent.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                        }`}>
                          {agent.status}
                        </span>
                      </CardTitle>
                      <CardDescription>{getAgentTypeLabel(agent.agent_type)}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunAgent(agent.id)}
                      disabled={loading}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    {agent.status === "active" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePauseAgent(agent.id)}
                        disabled={loading}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAgent(agent.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {agent.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Last Run</p>
                    <p className="font-medium">{formatDate(agent.last_run)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Next Run</p>
                    <p className="font-medium">{formatDate(agent.next_run)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Source</p>
                    <p className="font-medium">{agent.source}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewActivities(agent)}
                  >
                    View Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Activity Modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAgent?.name} - Activity History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                No activity yet
              </p>
            ) : (
              activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Type</p>
                        <p className="font-medium">{activity.activity_type}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Status</p>
                        <p className={`font-medium ${
                          activity.status === "completed" ? "text-green-600" : "text-slate-600"
                        }`}>
                          {activity.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Listings</p>
                        <p className="font-medium">{activity.listings_processed}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Scams Found</p>
                        <p className="font-medium">{activity.scams_detected}</p>
                      </div>
                    </div>
                    {activity.error_log && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{activity.error_log}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
