"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useRuntimeConfig } from "@/hooks/use-runtime-config"
import { api, type SemanticSearchResult, type ChatbotMessage, type ChatbotResponse } from "@/lib/api"
import { generateSessionId, formatChatbotResponse } from "@/lib/utils"
import { CandidateHoverCard } from "@/components/candidate-hover-card"
import { CandidateProfileModal } from "@/components/candidate-profile-modal"
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Paperclip,
  FileText,
  ChevronDown,
} from "lucide-react"

interface ChatMessage {
  id: string
  type: "user" | "assistant" | "system" | "candidates" | "error"
  content: string
  timestamp: Date
  candidates?: SemanticSearchResult[]
  metadata?: any
  isTyping?: boolean
}

interface ChatbotInterfaceProps {
  className?: string
}

export function ChatbotInterface({ className = "" }: ChatbotInterfaceProps) {
  const { config, loading: configLoading } = useRuntimeConfig()
  const [sessionId, setSessionId] = useState<string>("")
  const [isInitialized, setIsInitialized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "Hello! I'm your AI recruitment assistant. I can help you find the best candidates for your job openings. You can upload a PDF job description or simply describe what you're looking for, and I'll search through your talent pool to find the most suitable matches.",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [jobFile, setJobFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false)

  // Track when messages change to avoid auto-scroll on every update
  const [lastMessageCount, setLastMessageCount] = useState(1) // Start with 1 to account for welcome message
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // Candidate profile modal state
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const scrollToBottom = (force = false) => {
    if (!force && isUserScrolledUp) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Check if user has scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    
    const container = messagesContainerRef.current
    const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50
    setIsUserScrolledUp(!isScrolledToBottom)
  }

  // Initialize session ID on client side only
  useEffect(() => {
    if (!isInitialized) {
      setSessionId(generateSessionId())
      setIsInitialized(true)
    }
  }, [isInitialized])

  useEffect(() => {
    // Only scroll when:
    // 1. User has interacted (sent a message)
    // 2. A new message is added (count increased)
    // 3. Message is not currently being typed
    
    const lastMessage = messages[messages.length - 1]
    const messageCountIncreased = messages.length > lastMessageCount
    const isTypingUpdate = lastMessage?.isTyping && messages.length === lastMessageCount
    
    // Update the message count
    setLastMessageCount(messages.length)
    
    // Only scroll if user has interacted and it's a new message (not a typing update)
    if (hasUserInteracted && messageCountIncreased && !isTypingUpdate) {
      // Small delay to allow DOM to update
      setTimeout(() => scrollToBottom(), 10)
    }
  }, [messages, hasUserInteracted])

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
      // Only allow PDF files for webhook
      if (file.type === "application/pdf") {
        setJobFile(file)
        addMessage({
          type: "system",
          content: `PDF file attached: ${file.name} (${Math.round(file.size / 1024)} KB)`,
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are allowed for upload",
          variant: "destructive",
        })
      }
    }
  }

  // Typewriter effect for displaying responses
  const displayTypewriterMessage = (content: string, messageId: string) => {
    const words = content.split(' ')
    let currentIndex = 0
    
    // Get typewriter speed from runtime config
    const typewriterSpeed = config.typewriterSpeed || 100
    
    // Add initial empty message
    const initialMessage: ChatMessage = {
      id: messageId,
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true
    }
    
    setMessages(prev => [...prev, initialMessage])
    
    const typeInterval = setInterval(() => {
      if (currentIndex < words.length) {
        const currentContent = words.slice(0, currentIndex + 1).join(' ')
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: currentContent }
            : msg
        ))
        currentIndex++
      } else {
        // Typing complete
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isTyping: false }
            : msg
        ))
        setIsTyping(false)
        clearInterval(typeInterval)
        // Scroll to bottom once typing is complete (force scroll)
        setTimeout(() => scrollToBottom(true), 50)
      }
    }, typewriterSpeed)
  }

  const sendChatbotMessage = async (query: string, attachment?: File) => {
    try {
      setIsTyping(true)
      
      const chatbotMessage: ChatbotMessage = {
        sessionId,
        query,
        attachment
      }

      // Pass runtime config to API call
      const webhookConfig = {
        n8nWebhookUrl: config.n8nWebhookUrl,
        n8nAuthKey: config.n8nAuthKey,
        n8nAuthValue: config.n8nAuthValue
      }

      const response = await api.sendChatbotMessage(chatbotMessage, webhookConfig)
      const formattedResponse = formatChatbotResponse(response.response)
      
      // Check if typewriter effect is enabled from runtime config
      const typewriterEnabled = config.enableTypewriter
      
      if (typewriterEnabled) {
        // Use typewriter effect for the response
        const messageId = `response_${Date.now()}`
        displayTypewriterMessage(formattedResponse, messageId)
      } else {
        // Display response immediately
        addMessage({
          type: "assistant",
          content: formattedResponse,
        })
        setIsTyping(false)
      }
      
    } catch (error) {
      setIsTyping(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message to chatbot'
      addMessage({
        type: "error",
        content: errorMessage,
      })
      
      toast({
        title: "Chatbot Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !jobFile) return
    if (!sessionId) return // Don't send if session not initialized

    // Mark that user has interacted
    setHasUserInteracted(true)

    if (jobFile && !inputMessage.trim()) {
      // Send file with default query
      addMessage({
        type: "user",
        content: `[Uploaded PDF: ${jobFile.name}]`,
      })
      
      await sendChatbotMessage("Please analyze this job description and find suitable candidates.", jobFile)
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

      // Send message to chatbot webhook
      await sendChatbotMessage(userQuery, jobFile || undefined)
      
      // Clear file after sending
      if (jobFile) {
        setJobFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Parse candidate IDs from message content and create clickable buttons
  const parseCandidateIds = (content: string): Array<{type: 'text', content: string} | {type: 'candidate', candidateId: number, content: string}> => {
    const candidateIdRegex = /<candidate_id>(\d+)<\/candidate_id>/g
    const parts: Array<{type: 'text', content: string} | {type: 'candidate', candidateId: number, content: string}> = []
    let lastIndex = 0
    let match

    while ((match = candidateIdRegex.exec(content)) !== null) {
      // Add text before the candidate_id tag
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        })
      }

      // Add candidate button
      parts.push({
        type: 'candidate',
        candidateId: parseInt(match[1]),
        content: match[0]
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      })
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }]
  }

  const handleCandidateClick = (candidateId: number) => {
    setSelectedCandidateId(candidateId)
    setIsModalOpen(true)
  }

  const startNewConversation = () => {
    const newSessionId = generateSessionId()
    setSessionId(newSessionId)
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content:
          "Hello! I'm your AI recruitment assistant. I can help you find the best candidates for your job openings. You can upload a PDF job description or simply describe what you're looking for, and I'll search through your talent pool to find the most suitable matches.",
        timestamp: new Date(),
      },
    ])
    setJobFile(null)
    setInputMessage("")
    setIsTyping(false)
    setHasUserInteracted(false) // Reset interaction flag
    setLastMessageCount(1) // Reset message count
    setIsUserScrolledUp(false) // Reset scroll state
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    console.log('New conversation started with session ID:', newSessionId)
  }

  // Show loading state while config is loading
  if (configLoading) {
    return (
      <div className={`flex flex-col h-full ${className} items-center justify-center`}>
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <p className="text-sm text-gray-600">Loading chatbot configuration...</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat with AI Assistant
            </CardTitle>
            <CardDescription>
              Upload a job description or describe your hiring needs to find the best candidates
              {config.debug && (
                <>
                  <br />
                  <span className="text-xs text-gray-500 font-mono">
                    Session: {sessionId || 'Initializing...'} | 
                    Typewriter: {config.enableTypewriter ? `${config.typewriterSpeed}ms` : 'Off'} |
                    Webhook: {config.n8nWebhookUrl ? 'Configured' : 'Missing'}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={startNewConversation}>
            New Chat
          </Button>
        </div>
      </CardHeader>

      {/* Messages Area - Isolated Scrolling */}
      <CardContent 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-4 p-4 relative"
        onScroll={handleScroll}
      >
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
                    <div className="text-sm whitespace-pre-wrap">
                      {parseCandidateIds(message.content).map((part, index) => (
                        <span key={index}>
                          {part.type === 'text' ? (
                            part.content
                          ) : (
                            <CandidateHoverCard
                              candidateId={(part as {type: 'candidate', candidateId: number, content: string}).candidateId}
                              onViewFullProfile={() => handleCandidateClick((part as {type: 'candidate', candidateId: number, content: string}).candidateId)}
                            >
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-blue-600 hover:text-blue-800 underline font-normal"
                              >
                                View Profile #{(part as {type: 'candidate', candidateId: number, content: string}).candidateId}
                              </Button>
                            </CandidateHoverCard>
                          )}
                        </span>
                      ))}
                      {message.isTyping && <span className="animate-pulse">|</span>}
                    </div>
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
        
        {/* Scroll to bottom button */}
        {isUserScrolledUp && (
          <div className="absolute bottom-4 right-4">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full shadow-lg bg-white hover:bg-gray-50"
              onClick={() => scrollToBottom(true)}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
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
            accept=".pdf"
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

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidateId={selectedCandidateId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedCandidateId(null)
        }}
      />
    </div>
  )
} 