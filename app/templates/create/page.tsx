"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { CheckCircle, AlertCircle, Save, ArrowLeft } from "lucide-react"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export default function CreateTemplatePage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    template_content: "",
    created_by: "admin@company.com", // This would come from auth context
  })
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const validateTemplate = (content: string): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for required placeholder
    if (!content.includes("{candidate_profile_data}")) {
      errors.push("Template must contain '{candidate_profile_data}' placeholder")
    }

    // Check minimum length
    if (content.trim().length < 50) {
      errors.push("Template content must be at least 50 characters long")
    }

    // Check for common issues
    if (!content.toLowerCase().includes("summarize") && !content.toLowerCase().includes("summary")) {
      warnings.push("Template doesn't seem to request a summary")
    }

    if (!content.toLowerCase().includes("professional") && !content.toLowerCase().includes("career")) {
      warnings.push("Consider including professional/career context in the prompt")
    }

    // Check for AI instruction patterns
    if (!content.toLowerCase().includes("you are") && !content.toLowerCase().includes("act as")) {
      warnings.push("Consider starting with clear AI role definition (e.g., 'You are an AI assistant...')")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({ ...prev, template_content: content }))
    setValidation(validateTemplate(content))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the template errors before saving",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await api.createPromptTemplate(formData)

      if (response.success) {
        toast({
          title: "Success",
          description: "Prompt template created successfully",
        })
        router.push("/templates")
      } else {
        throw new Error("Failed to create template")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create prompt template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultTemplate = `You are an AI assistant specialized in creating professional candidate summaries for recruitment purposes.

Please analyze the following candidate profile data and create a concise, professional summary that highlights:
1. Key professional experience and expertise
2. Notable skills and competencies
3. Career progression and achievements
4. Relevant qualifications and certifications
5. Overall suitability for recruitment opportunities

Candidate Profile Data:
{candidate_profile_data}

Please provide a summary that is:
- Professional and objective in tone
- 2-3 paragraphs in length
- Focused on recruitment-relevant information
- Easy to read and understand for hiring managers

Summary:`

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <PageHeader
        title="Create Prompt Template"
        description="Create a new AI prompt template for candidate profile summarization"
      >
        <Button variant="outline" onClick={() => router.push("/templates")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>Provide basic information about the prompt template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Professional Summary Template"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this template is used for..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Content</CardTitle>
            <CardDescription>
              Write the AI prompt template. Must include {"{candidate_profile_data}"} placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="template_content">Prompt Template *</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => handleContentChange(defaultTemplate)}>
                  Use Default Template
                </Button>
              </div>
              <Textarea
                id="template_content"
                value={formData.template_content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="You are an AI assistant... {candidate_profile_data}..."
                rows={15}
                className="font-mono text-sm"
                required
              />
            </div>

            {/* Validation Results */}
            {formData.template_content && (
              <div className="space-y-2">
                {validation.isValid ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Template validation passed! Ready to save.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      <div className="font-medium mb-1">Validation Errors:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.warnings.length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      <div className="font-medium mb-1">Suggestions:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Template Guidelines */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Template Guidelines:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Must include <code className="bg-blue-100 px-1 rounded">{"{candidate_profile_data}"}</code>{" "}
                  placeholder
                </li>
                <li>• Start with clear AI role definition (e.g., "You are an AI assistant...")</li>
                <li>• Specify the desired output format and length</li>
                <li>• Include specific instructions for what to highlight</li>
                <li>• Keep the tone professional and objective</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/templates")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!validation.isValid || loading || !formData.name.trim()}>
            {loading ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Template
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
