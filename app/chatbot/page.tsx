"use client"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatbotInterface } from "@/components/chatbot-interface"
import {
  Upload,
  Eye,
  TrendingUp,
  Info,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

export default function ChatbotPage() {
  const exampleQueries = [
    "Find a senior React developer with 5+ years experience",
    "Looking for a data scientist with Python and ML skills",
    "Need a DevOps engineer with AWS and Kubernetes experience",
    "Search for full-stack developers with Node.js background",
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
      <PageHeader
        title="AI Recruitment Assistant"
        description="Chat with AI to find the perfect candidates for your job openings"
      >
            <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
        </Button>
      </PageHeader>
                        </div>
                      </div>

      {/* Main Chat Area - Full Height Container */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-6xl min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Chat Interface - Full Height and Isolated */}
          <div className="lg:col-span-3 h-full">
            <Card className="h-full">
              <ChatbotInterface className="h-full" />
          </Card>
        </div>

          {/* Sidebar - Full Height */}
          <div className="lg:col-span-1 space-y-4 h-full overflow-y-auto">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent"
                  onClick={() => {
                    const fileInput = document.createElement('input')
                    fileInput.type = 'file'
                    fileInput.accept = '.pdf'
                    fileInput.click()
                  }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Job Description
              </Button>
              <Link href="/search" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Advanced Search
                </Button>
              </Link>
              <Link href="/candidates" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Eye className="w-4 h-4 mr-2" />
                  Browse All Candidates
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Example Queries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Example Queries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exampleQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-2 whitespace-normal"
                  onClick={() => {
                      // This could be enhanced to send the query to the chatbot
                      navigator.clipboard.writeText(query)
                  }}
                >
                  <span className="text-xs">{query}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Info className="w-4 h-4 mr-2" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Job Description Upload</h4>
                  <p>Upload PDF files containing job requirements for automatic analysis.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Natural Language Search</h4>
                <p>
                  Describe what you're looking for in plain English, including skills, experience, and requirements.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Candidate Selection</h4>
                <p>Review AI-matched candidates and click "View Profile" to see detailed information.</p>
              </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Response Animation</h4>
                  <p>AI responses use a typewriter effect for better readability. Speed can be configured via environment variables.</p>
                </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
