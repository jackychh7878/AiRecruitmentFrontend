"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { api, type PromptTemplate } from "@/lib/api"
import { CheckCircle, AlertCircle, Save, ArrowLeft, Loader2 } from "lucide-react"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<PromptTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    template_content: "",
  })
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const templateId = Number.parseInt(params.id as string)

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true)
        // Since we don't have a specific get template endpoint, we'll get all and find the one
        const response = await api.getPromptTemplates({ per_page: 100 })
        const foundTemplate = response.templates.find((t) => t.id === templateId)

        if (foundTemplate) {
          setTemplate(foundTemplate)
          setFormData({
            name: foundTemplate.name,
            description: foundTemplate.description || "",
            template_content: foundTemplate.template_content,
          })
          setValidation(validateTemplate(foundTemplate.template_content))
        } else {
          throw new Error("Template not found")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        })
        router.push("/templates")
      } finally {
        setLoading(false)
      }
    }

    if (templateId) {
      loadTemplate()
    }
  }, [templateId, router, toast])

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
      setSaving(true)
      const response = await api.updatePromptTemplate(templateId, formData)

      if (response.success) {
        toast({
          title: "Success",
          description: "Prompt template updated successfully",
        })
        router.push("/templates")
      } else {
        throw new Error("Failed to update template")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update prompt template",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Template not found</h2>
          <p className="text-gray-600 mt-2">The template you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/templates")} className="mt-4">
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <PageHeader
        title={`Edit Template: ${template.name}`}
        description="Update the AI prompt template for candidate profile summarization"
      >
        <div className="flex items-center space-x-2">
          {template.is_active && <Badge className="bg-green-100 text-green-800">Active</Badge>}
          <Button variant="outline" onClick={() => router.push("/templates")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </PageHeader>

      {template.is_active && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <strong>Warning:</strong> This is the currently active template. Changes will affect all future AI summary
            generations.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>Update basic information about the prompt template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Version:</span> {template.version_number}
              </div>
              <div>
                <span className="font-medium">Created by:</span> {template.created_by}
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(template.created_date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Modified:</span>{" "}
                {new Date(template.last_modified_date).toLocaleDateString()}
              </div>
            </div>

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
              Update the AI prompt template. Must include {"{candidate_profile_data}"} placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template_content">Prompt Template *</Label>
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
          <Button type="submit" disabled={!validation.isValid || saving || !formData.name.trim()}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
