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
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { api, type CandidateProfile, convertStringToArray, convertArrayToString } from "@/lib/api"
import { useCitizenshipCodes, useClassificationCodes, /* useSubClassificationCodes, */ usePreferredWorkTypesCodes } from "@/hooks/use-lookup-codes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react"

type CreationStep = "upload" | "parsing" | "review" | "creating" | "finalizing" | "complete"

export default function CreateCandidatePage() {
  const [step, setStep] = useState<CreationStep>("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Partial<CandidateProfile> | null>(null)
  const [confidenceScore, setConfidenceScore] = useState<number>(0)
  const [formData, setFormData] = useState<Partial<CandidateProfile>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch lookup codes dynamically
  const { codes: citizenshipCodes, loading: citizenshipLoading } = useCitizenshipCodes()
  const { codes: classificationCodes, loading: classificationLoading } = useClassificationCodes()
  // const { codes: subClassificationCodes, loading: subClassificationLoading } = useSubClassificationCodes()
  const { codes: workTypesCodes, loading: workTypesLoading } = usePreferredWorkTypesCodes()

  // Convert work types for multi-select
  const selectedWorkTypes = convertStringToArray(formData.preferred_work_types)
  const workTypesOptions = workTypesCodes.map(code => ({ value: code.com_code, label: code.com_code }))

  // Helper to set step (keeping for consistency)
  const setStepWithDebug = (newStep: CreationStep) => {
    setStep(newStep)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      })
    }
  }

  const handleParseResume = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      setStepWithDebug("parsing")

      const response = await api.parseResume(selectedFile)

      if (response.success) {
        setParsedData(response.parsed_data)
        setConfidenceScore(response.confidence_score)
        setFormData(response.parsed_data)
        setStepWithDebug("review")

        toast({
          title: "Resume parsed successfully",
          description: `Confidence score: ${Math.round(response.confidence_score * 100)}%`,
        })
      } else {
        throw new Error("Failed to parse resume")
      }
    } catch (error) {
      toast({
        title: "Parsing failed",
        description: "Failed to parse resume. Please try again or enter data manually.",
        variant: "destructive",
      })
      setStepWithDebug("upload")
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field: keyof CandidateProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleWorkTypesChange = (values: string[]) => {
    const joinedValues = convertArrayToString(values)
    handleFormChange("preferred_work_types", joinedValues)
  }

  const handleCreateProfile = async () => {
    try {
      setLoading(true)
      setStep("creating")

      // Create candidate profile with parsed data and remarks
      const createResponse = await api.createFromParsedData({
        parsed_data: formData,
        remarks: formData.remarks || "Created from resume parsing"
      })

      if (!createResponse.success || !createResponse.candidate) {
        throw new Error("Failed to create candidate profile")
      }

      const candidateId = createResponse.candidate.id

      // Upload resume file
      if (selectedFile) {
        await api.uploadResume(candidateId, selectedFile, "Initial resume upload")
      }

      setStep("finalizing")

      // Trigger AI summary generation
      await api.updateCandidate(candidateId, {}, true)

      setStep("complete")

      toast({
        title: "Success",
        description: "Candidate profile created and AI summary generated",
      })

      // Redirect to candidate details after a short delay
      setTimeout(() => {
        router.push(`/candidates/${candidateId}`)
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create candidate profile",
        variant: "destructive",
      })
      setStep("review")
    } finally {
      setLoading(false)
    }
  }

  const getStepProgress = () => {
    switch (step) {
      case "upload":
        return 0
      case "parsing":
        return 20
      case "review":
        return 40
      case "creating":
        return 60
      case "finalizing":
        return 80
      case "complete":
        return 100
      default:
        return 0
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <PageHeader
        title="Create New Candidate"
        description="Upload a resume to automatically extract candidate information, then review and finalize the profile"
      />

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Upload Resume</span>
          <span>Review & Edit</span>
          <span>Create Profile</span>
          <span>AI Processing</span>
          <span>Complete</span>
        </div>
        <Progress value={getStepProgress()} className="h-2" />
      </div>

      {/* Step 1: Upload Resume */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload Resume
            </CardTitle>
            <CardDescription>Select a PDF resume to automatically extract candidate information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="text-lg font-medium text-gray-900 mb-2">Choose a PDF file</div>
                    <div className="text-sm text-gray-500">Drag and drop or click to browse</div>
                  </Label>
                  <Input id="resume-upload" type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                </div>

                {selectedFile && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-gray-500">({Math.round(selectedFile.size / 1024)} KB)</span>
                    </div>
                    <Button onClick={handleParseResume} className="mt-4 w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Parsing Resume...
                        </>
                      ) : (
                        "Parse Resume"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => router.push("/candidates")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Parsing */}
      {step === "parsing" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Parsing Resume</h3>
              <p className="text-gray-600">Our AI is extracting information from the resume...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review and Edit */}
      {step === "review" && parsedData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Review Extracted Information
                <div className="flex items-center space-x-2">
                  {confidenceScore >= 0.8 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="text-sm font-normal">Confidence: {Math.round(confidenceScore * 100)}%</span>
                </div>
              </CardTitle>
              <CardDescription>Review and edit the extracted information before creating the profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ""}
                    onChange={(e) => handleFormChange("first_name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ""}
                    onChange={(e) => handleFormChange("last_name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number || ""}
                    onChange={(e) => handleFormChange("phone_number", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) => handleFormChange("location", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="salary_expectation">Salary Expectation</Label>
                  <Input
                    id="salary_expectation"
                    type="number"
                    value={formData.salary_expectation || ""}
                    onChange={(e) => handleFormChange("salary_expectation", Number.parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classification_of_interest">Classification</Label>
                  <Select
                    value={formData.classification_of_interest || "not-specified"}
                    onValueChange={(value) => handleFormChange("classification_of_interest", value === "not-specified" ? "" : value)}
                    disabled={classificationLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-specified">-- Not specified --</SelectItem>
                      {classificationCodes.map((code) => (
                        <SelectItem key={code.id} value={code.com_code}>
                          {code.com_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Temporarily commented out Sub-classification field */}
                {/* <div>
                  <Label htmlFor="sub_classification_of_interest">Sub-classification</Label>
                  <Select
                    value={formData.sub_classification_of_interest || "not-specified"}
                    onValueChange={(value) => handleFormChange("sub_classification_of_interest", value === "not-specified" ? "" : value)}
                    disabled={subClassificationLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-specified">-- Not specified --</SelectItem>
                      {subClassificationCodes.map((code) => (
                        <SelectItem key={code.id} value={code.com_code}>
                          {code.com_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}
                <div>
                  <Label htmlFor="citizenship">Citizenship / Work Status</Label>
                  <Select
                    value={formData.citizenship || "not-specified"}
                    onValueChange={(value) => handleFormChange("citizenship", value === "not-specified" ? "" : value)}
                    disabled={citizenshipLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select citizenship status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-specified">-- Not specified --</SelectItem>
                      {citizenshipCodes.map((code) => (
                        <SelectItem key={code.id} value={code.com_code}>
                          {code.com_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="availability_weeks">Availability (weeks)</Label>
                  <Input
                    id="availability_weeks"
                    type="number"
                    value={formData.availability_weeks || ""}
                    onChange={(e) => handleFormChange("availability_weeks", Number.parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_work_types">Preferred Work Types</Label>
                  <MultiSelect
                    options={workTypesOptions}
                    value={selectedWorkTypes}
                    onChange={handleWorkTypesChange}
                    placeholder="Select work types..."
                    disabled={workTypesLoading}
                  />
                </div>
              </div>

              {/* Personal Summary */}
              <div>
                <Label htmlFor="personal_summary">Personal Summary</Label>
                <Textarea
                  id="personal_summary"
                  value={formData.personal_summary || ""}
                  onChange={(e) => handleFormChange("personal_summary", e.target.value)}
                  rows={4}
                />
              </div>

              {/* Right to Work */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="right_to_work"
                  checked={formData.right_to_work || false}
                  onCheckedChange={(checked) => handleFormChange("right_to_work", checked)}
                />
                <Label htmlFor="right_to_work">Has right to work</Label>
              </div>

              {/* Remarks */}
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks || ""}
                  onChange={(e) => handleFormChange("remarks", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back to Upload
            </Button>
            <Button
              onClick={handleCreateProfile}
              disabled={!formData.first_name || !formData.last_name || !formData.email}
            >
              Create Profile
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Creating */}
      {step === "creating" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Creating Profile</h3>
              <p className="text-gray-600">Creating candidate profile and uploading resume...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Finalizing */}
      {step === "finalizing" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Generating AI Summary</h3>
              <p className="text-gray-600">
                Our AI is analyzing the profile and generating embeddings for semantic search...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Complete */}
      {step === "complete" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Profile Created Successfully!</h3>
              <p className="text-gray-600 mb-4">
                The candidate profile has been created and AI summary generated. Redirecting to profile details...
              </p>
              <Button onClick={() => router.push("/candidates")}>Back to Candidates</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
