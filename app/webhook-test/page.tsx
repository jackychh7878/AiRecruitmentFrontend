"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { generateSessionId, formatChatbotResponse } from "@/lib/utils"

export default function WebhookTestPage() {
  const [sessionId, setSessionId] = useState<string>("")
  const [query, setQuery] = useState("Hello, can you help me find a software engineer?")
  const [response, setResponse] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  // Initialize session ID on client side only
  useEffect(() => {
    setSessionId(generateSessionId())
  }, [])

  const testWebhook = async () => {
    setLoading(true)
    setError("")
    setResponse("")

    try {
      const result = await api.sendChatbotMessage({
        sessionId,
        query,
        attachment: file || undefined
      })

      const formattedResponse = formatChatbotResponse(result.response)
      setResponse(formattedResponse)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Webhook test error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile)
      } else {
        setError("Only PDF files are allowed")
        event.target.value = ""
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>N8N Webhook Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Session ID:</label>
            <Input value={sessionId || 'Initializing...'} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Query:</label>
            <Input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your message..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">PDF Attachment (optional):</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>

          <Button onClick={testWebhook} disabled={loading || !query.trim() || !sessionId}>
            {loading ? "Testing..." : "Test Webhook"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response:</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                  {response}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <strong>Webhook URL:</strong> {process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'Not set'}
              </div>
              <div>
                <strong>Auth Key:</strong> {process.env.NEXT_PUBLIC_N8N_AUTH_KEY || 'Not set'}
              </div>
              <div>
                <strong>Auth Value:</strong> {process.env.NEXT_PUBLIC_N8N_AUTH_VALUE ? '***' : 'Not set'}
              </div>
              <div>
                <strong>Expected Response Format:</strong>
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs">
{`{
  "response": "Your chatbot response here..."
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
} 