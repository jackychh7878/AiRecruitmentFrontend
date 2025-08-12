"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Search, MessageSquare, FileText } from "lucide-react"

export default function HomePage() {
  const [activeModule, setActiveModule] = useState<string | null>(null)

  const modules = [
    {
      id: "candidates",
      title: "Candidate Management",
      description: "Manage talent pool, create and update candidate profiles",
      icon: Users,
      href: "/candidates",
    },
    {
      id: "templates",
      title: "Prompt Templates",
      description: "Manage AI summary generation templates",
      icon: FileText,
      href: "/templates",
    },
    {
      id: "search",
      title: "Semantic Search",
      description: "Search candidates using natural language queries",
      icon: Search,
      href: "/search",
    },
    {
      id: "chatbot",
      title: "AI Assistant",
      description: "Chat with AI to find candidates for job descriptions",
      icon: MessageSquare,
      href: "/chatbot",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#068ee1]/10 to-[#7ac20f]/10">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Talent Management System</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered headhunting platform to manage your talent pool with semantic search and intelligent candidate
            matching
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Card
                key={module.id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#068ee1]"
                onClick={() => setActiveModule(module.id)}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-[#068ee1]/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#068ee1]" />
                  </div>
                  <CardTitle className="text-lg text-black">{module.title}</CardTitle>
                  <CardDescription className="text-sm">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-transparent border-[#068ee1] text-[#068ee1] hover:bg-[#068ee1] hover:text-white"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = module.href
                    }}
                  >
                    Open Module
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-black mb-4">System Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <h3 className="font-medium text-black">Candidate Management</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Resume parsing and auto-fill</li>
                  <li>• AI-powered profile summaries</li>
                  <li>• Modular profile editing</li>
                  <li>• Soft/hard delete options</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-black">AI Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Semantic search with confidence levels</li>
                  <li>• Customizable prompt templates</li>
                  <li>• Bulk AI regeneration</li>
                  <li>• Intelligent candidate matching</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
