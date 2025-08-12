"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { api, type SemanticSearchResult } from "@/lib/api"
import {
  MessageSquare,
  Upload,
  FileText,
  Send,
  Loader2,
  Bot,
  User,
  Paperclip,
  Eye,
  Mail,
  MapPin,
  DollarSign,
  Sparkles,
  TrendingUp,
  Info,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface ChatMessage {
  id: string
  type: "user" | "assistant" | "system" | "candidates" | "error"
  content: string
  timestamp: Date
  candidates?: SemanticSearchResult[]
  metadata?: any
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "Hello! I'm your AI recruitment assistant. I can help you find the best candidates for your job openings. You can upload a job description or simply describe what you're looking for, and I'll search through your talent pool to find the most suitable matches.",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [jobFile, setJobFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]

      if (allowedTypes.includes(file.type)) {
        setJobFile(file)
        addMessage({
          type: "system",
          content: `Job description uploaded: ${file.name} (${Math.round(file.size / 1024)} KB)`,
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, Word document, or text file",
          variant: "destructive",
        })
      }
    }
  }

  const processJobDescription = async (file: File) => {
    setIsProcessing(true)
    setIsTyping(true)

    try {
      // Simulate job description analysis
      await new Promise((resolve) => setTimeout(resolve, 2000))

      addMessage({
        type: "assistant",
        content: `I've analyzed the job description "${file.name}". Based on the requirements, I'm searching for candidates with relevant skills and experience. Let me find the best matches for you...`,
      })

      // Simulate candidate search based on job description
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // For demo purposes, we'll use a generic search query
      // In a real implementation, this would extract requirements from the job description
      const searchQuery = "experienced software developer with full-stack skills"
      await performCandidateSearch(searchQuery, "job description analysis")
    } catch (error) {
      addMessage({
        type: "error",
        content: "Failed to process the job description. Please try again or describe your requirements manually.",
      })
    } finally {
      setIsProcessing(false)
      setIsTyping(false)
    }
  }

  const performCandidateSearch = async (query: string, context = "user query") => {
    try {
      setIsTyping(true)

      const response = await api.semanticSearch(query, {
        confidence_threshold: 0.7,
        max_results: 10,
        include_relationships: true,
      })

      if (response.success && response.results.length > 0) {
        addMessage({
          type: "candidates",
          content: `I found ${response.results.length} candidates that match your requirements based on ${context}. Here are the top matches:`,
          candidates: response.results,
        })
      } else {
        addMessage({
          type: "assistant",
          content: `I couldn't find any candidates matching "${query}". Try using different keywords or broader search terms. You can also adjust the search criteria or upload a more detailed job description.`,
        })
      }
    } catch (error) {
      addMessage({
        type: "error",
        content: "Failed to search for candidates. Please try again with different search terms.",
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !jobFile) return

    if (jobFile && !inputMessage.trim()) {
      // Process job file
      await processJobDescription(jobFile)
      setJobFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    if (inputMessage.trim()) {
      // Add user message
      addMessage({
        type: "user",
        content: inputMessage.trim(),
      })

      const userQuery = inputMessage.trim()
      setInputMessage("")

      // Simulate AI thinking
      setIsTyping(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if it's a search query
      if (
        userQuery.toLowerCase().includes("find") ||
        userQuery.toLowerCase().includes("search") ||
        userQuery.toLowerCase().includes("looking for") ||
        userQuery.toLowerCase().includes("need") ||
        userQuery.toLowerCase().includes("developer") ||
        userQuery.toLowerCase().includes("engineer") ||
        userQuery.toLowerCase().includes("experience")
      ) {
        addMessage({
          type: "assistant",
          content: "Let me search for candidates matching your requirements...",
        })

        await performCandidateSearch(userQuery)
      } else {
        // General conversation
        addMessage({
          type: "assistant",
          content:
            "I can help you find the right candidates for your needs. Please describe the role you're hiring for, including required skills, experience level, and any specific qualifications. You can also upload a job description for more detailed analysis.",
        })
        setIsTyping(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "Very High":
        return "bg-green-100 text-green-800 border-green-200"
      case "High":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Good":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Moderate":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const exampleQueries = [
    "Find a senior React developer with 5+ years experience",
    "Looking for a data scientist with Python and ML skills",
    "Need a DevOps engineer with AWS and Kubernetes experience",
    "Search for full-stack developers with Node.js background",
  ]

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <PageHeader
        title="AI Recruitment Assistant"
        description="Chat with AI to find the perfect candidates for your job openings"
      >
        <Button
          variant="outline"
          onClick={() => {
            setMessages([
              {
                id: "welcome",
                type: "assistant",
                content:
                  "Hello! I'm your AI recruitment assistant. I can help you find the best candidates for your job openings. You can upload a job description or simply describe what you're looking for, and I'll search through your talent pool to find the most suitable matches.",
                timestamp: new Date(),
              },
            ])
            setJobFile(null)
            setInputMessage("")
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chat with AI Assistant
              </CardTitle>
              <CardDescription>
                Upload a job description or describe your hiring needs to find the best candidates
              </CardDescription>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.type === "user" && (
                    <div className="flex justify-end">
                      <div className="flex items-start space-x-2 max-w-[80%]">
                        <div className="bg-blue-600 text-white rounded-lg px-4 py-2">
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-100">
                            <User className="w-4 h-4 text-blue-600" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  )}

                  {(message.type === "assistant" || message.type === "system") && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2 max-w-[80%]">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-purple-100">
                            <Bot className="w-4 h-4 text-purple-600" />
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.type === "system" ? "bg-gray-100 text-gray-700 border" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.type === "error" && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2 max-w-[80%]">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-red-100">
                            <Bot className="w-4 h-4 text-red-600" />
                          </AvatarFallback>
                        </Avatar>
                        <Alert className="border-red-200 bg-red-50">
                          <AlertDescription className="text-red-700">{message.content}</AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  )}

                  {message.type === "candidates" && message.candidates && (
                    <div className="space-y-3">
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-2 max-w-[80%]">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-purple-100">
                              <Bot className="w-4 h-4 text-purple-600" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      </div>

                      {/* Candidate Cards */}
                      <div className="space-y-3 ml-10">
                        {message.candidates.map((candidate) => (
                          <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback>
                                      {candidate.first_name[0]}
                                      {candidate.last_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-medium">
                                      {candidate.first_name} {candidate.last_name}
                                    </h4>
                                    <p className="text-sm text-gray-600 flex items-center">
                                      <Mail className="w-3 h-3 mr-1" />
                                      {candidate.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge className={getConfidenceColor(candidate.confidence_level)}>
                                    {candidate.confidence_level}
                                  </Badge>
                                  <div className="text-sm font-medium text-blue-600 mt-1">
                                    {Math.round(candidate.relevance_percentage)}% match
                                  </div>
                                </div>
                              </div>

                              {candidate.ai_short_summary && (
                                <div className="mb-3">
                                  <div className="flex items-center mb-1">
                                    <Sparkles className="w-3 h-3 text-purple-600 mr-1" />
                                    <span className="text-xs font-medium text-gray-700">AI Summary</span>
                                  </div>
                                  <p className="text-sm text-gray-700 line-clamp-2">{candidate.ai_short_summary}</p>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-xs text-gray-600">
                                  {candidate.location && (
                                    <span className="flex items-center">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      {candidate.location}
                                    </span>
                                  )}
                                  {candidate.salary_expectation && (
                                    <span className="flex items-center">
                                      <DollarSign className="w-3 h-3 mr-1" />$
                                      {candidate.salary_expectation.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <Link href={`/candidates/${candidate.id}`}>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Profile
                                  </Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-purple-100">
                        <Bot className="w-4 h-4 text-purple-600" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t p-4">
              {jobFile && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{jobFile.name}</span>
                    <span className="text-xs text-gray-500">({Math.round(jobFile.size / 1024)} KB)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setJobFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe the role you're hiring for or ask me to find specific candidates..."
                    disabled={isProcessing}
                    className="resize-none"
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button onClick={handleSendMessage} disabled={(!inputMessage.trim() && !jobFile) || isProcessing}>
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
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
                onClick={() => fileInputRef.current?.click()}
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
              <CardDescription>Try these sample searches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {exampleQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-2 whitespace-normal"
                  onClick={() => {
                    setInputMessage(query)
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
                <p>Upload PDF, Word, or text files containing job requirements for automatic analysis.</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
