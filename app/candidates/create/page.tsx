"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { api, type CandidateProfile, type CareerHistory, type Skills, type Education, type LicenseCertification, type Language, convertStringToArray, convertArrayToString } from "@/lib/api"
import { useCitizenshipCodes, useClassificationCodes, usePreferredWorkTypesCodes, useSubClassificationCodes } from "@/hooks/use-lookup-codes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { CandidateEntityModal } from "@/components/candidate-entity-modal"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, User, Briefcase, Award, GraduationCap, Languages as LanguagesIcon, Plus, Edit, Trash2 } from "lucide-react"

type CreationStep = "upload" | "parsing" | "review" | "creating" | "finalizing" | "complete"

// Component for required field labels with red asterisk
const RequiredLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
  <Label htmlFor={htmlFor} className="flex items-center gap-1">
    {children}
    <span className="text-red-500">*</span>
  </Label>
)

export default function CreateCandidatePage() {
  const [step, setStep] = useState<CreationStep>("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Partial<CandidateProfile> | null>(null)
  const [confidenceScore, setConfidenceScore] = useState<number>(0)
  const [formData, setFormData] = useState<Partial<CandidateProfile>>({})
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch lookup codes dynamically
  const { codes: citizenshipCodes, loading: citizenshipLoading } = useCitizenshipCodes()
  const { codes: classificationCodes, loading: classificationLoading } = useClassificationCodes()
  const { codes: workTypesCodes, loading: workTypesLoading } = usePreferredWorkTypesCodes()
  const { codes: subClassificationCodes, loading: subClassificationLoading } = useSubClassificationCodes()

  // Convert work types for multi-select
  const selectedWorkTypes = convertStringToArray(formData.preferred_work_types)
  const workTypesOptions = workTypesCodes.map(code => ({ value: code.com_code, label: code.com_code }))

  // Convert role tags for multi-select (with predefined options from com codes + allow free-form)
  const selectedRoleTags = convertStringToArray(formData.sub_classification_of_interest)
  const roleTagsOptions = subClassificationCodes.map(code => ({ value: code.com_code, label: code.com_code }))

  // State for nested entities (separate from formData for better control)
  const [careerHistory, setCareerHistory] = useState<CareerHistory[]>([])
  const [skills, setSkills] = useState<Skills[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [licensesCertifications, setLicensesCertifications] = useState<LicenseCertification[]>([])
  const [languages, setLanguages] = useState<Language[]>([])

  // Modal state for editing nested entities
  const [editingItem, setEditingItem] = useState<{
    type: 'career' | 'skill' | 'education' | 'certification' | 'language' | null
    item: any
    isNew: boolean
  }>({ type: null, item: null, isNew: false })

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Re-validate when nested entities change
  useEffect(() => {
    if (step === "review") {
      setTimeout(() => {
        const updatedValidationErrors = validateForm()
        setValidationErrors(updatedValidationErrors)
      }, 100)
    }
  }, [languages, licensesCertifications, skills, education, careerHistory, step])

  // Prevent default drag behavior for the entire page
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handlePageDragEnter = (e: DragEvent) => {
      preventDefaults(e)
    }

    const handlePageDragOver = (e: DragEvent) => {
      preventDefaults(e)
    }

    const handlePageDrop = (e: DragEvent) => {
      preventDefaults(e)
    }

    // Add event listeners
    document.addEventListener('dragenter', handlePageDragEnter)
    document.addEventListener('dragover', handlePageDragOver)
    document.addEventListener('drop', handlePageDrop)

    // Cleanup
    return () => {
      document.removeEventListener('dragenter', handlePageDragEnter)
      document.removeEventListener('dragover', handlePageDragOver)
      document.removeEventListener('drop', handlePageDrop)
    }
  }, [])

  // Helper to set step
  const setStepWithDebug = (newStep: CreationStep) => {
    setStep(newStep)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    processSelectedFile(file)
  }

  const processSelectedFile = (file: File | undefined) => {
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    } else if (file) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      processSelectedFile(file)
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
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
        loadNestedEntities(response.parsed_data) // Load nested entities for editing
        
        // Perform initial validation to show users what needs attention
        setTimeout(() => {
          const initialValidationErrors = validateInitialParsedData(response.parsed_data)
          setValidationErrors(initialValidationErrors)
        }, 200) // Small delay to ensure state is updated and UI is rendered
        
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
    
    // Always re-validate immediately when basic form changes
    setTimeout(() => {
      const updatedValidationErrors = validateForm()
      setValidationErrors(updatedValidationErrors)
    }, 100)
  }

  const handleWorkTypesChange = (values: string[]) => {
    const joinedValues = convertArrayToString(values)
    handleFormChange("preferred_work_types", joinedValues)
  }

  const handleRoleTagsChange = (values: string[]) => {
    const joinedValues = convertArrayToString(values)
    handleFormChange("sub_classification_of_interest", joinedValues)
  }

  // Load nested entities when parsed data is available
  const loadNestedEntities = (data: Partial<CandidateProfile>) => {
    // Create deep copies with unique temporary IDs to avoid sharing object references
    const timestamp = Date.now()
    const careerWithIds = (data.career_history || []).map((item, index) => ({ ...item, id: item.id || -(timestamp + index) }))
    const skillsWithIds = (data.skills || []).map((item, index) => ({ ...item, id: item.id || -(timestamp + index + 1000) }))
    const educationWithIds = (data.education || []).map((item, index) => ({ ...item, id: item.id || -(timestamp + index + 2000) }))
    const certsWithIds = (data.licenses_certifications || []).map((item, index) => ({ ...item, id: item.id || -(timestamp + index + 3000) }))
    const languagesWithIds = (data.languages || []).map((item, index) => ({ ...item, id: item.id || -(timestamp + index + 4000) }))
    

    
    setCareerHistory(careerWithIds)
    setSkills(skillsWithIds)
    setEducation(educationWithIds)
    setLicensesCertifications(certsWithIds)
    setLanguages(languagesWithIds)
  }

  // CRUD handlers for nested entities
  const handleCreateItem = (type: 'career' | 'skill' | 'education' | 'certification' | 'language') => {
    const newItem = getEmptyItem(type)
    setEditingItem({ type, item: newItem, isNew: true })
  }

  const handleEditItem = (type: 'career' | 'skill' | 'education' | 'certification' | 'language', item: any) => {
    // Create a copy to avoid mutating the original object
    setEditingItem({ type, item: { ...item }, isNew: false })
  }

  const handleDeleteItem = (type: 'career' | 'skill' | 'education' | 'certification' | 'language', itemIndex: number) => {
    switch (type) {
      case 'career':
        setCareerHistory(prev => prev.filter((_, index) => index !== itemIndex))
        break
      case 'skill':
        setSkills(prev => prev.filter((_, index) => index !== itemIndex))
        break
      case 'education':
        setEducation(prev => prev.filter((_, index) => index !== itemIndex))
        break
      case 'certification':
        setLicensesCertifications(prev => prev.filter((_, index) => index !== itemIndex))
        break
      case 'language':
        setLanguages(prev => prev.filter((_, index) => index !== itemIndex))
        break
    }
    
    // Refresh validation after deleting an item
    setTimeout(() => {
      const updatedValidationErrors = validateForm()
      setValidationErrors(updatedValidationErrors)
    }, 100)
  }

  const handleSaveItem = (type: 'career' | 'skill' | 'education' | 'certification' | 'language', itemData: any, isNew: boolean) => {
    // Use negative timestamp to ensure unique temporary IDs that don't conflict with database IDs
    const tempId = -Date.now() - Math.floor(Math.random() * 1000)
    
    switch (type) {
      case 'career':
        if (isNew) {
          setCareerHistory(prev => [...prev, { ...itemData, id: tempId }])
        } else {
          setCareerHistory(prev => prev.map(item => item.id === itemData.id ? itemData : item))
        }
        break
      case 'skill':
        if (isNew) {
          setSkills(prev => [...prev, { ...itemData, id: tempId }])
        } else {
          setSkills(prev => prev.map(item => item.id === itemData.id ? itemData : item))
        }
        break
      case 'education':
        if (isNew) {
          setEducation(prev => [...prev, { ...itemData, id: tempId }])
        } else {
          setEducation(prev => prev.map(item => item.id === itemData.id ? itemData : item))
        }
        break
      case 'certification':
        if (isNew) {
          setLicensesCertifications(prev => [...prev, { ...itemData, id: tempId }])
        } else {
          setLicensesCertifications(prev => prev.map(item => item.id === itemData.id ? itemData : item))
        }
        break
      case 'language':
        if (isNew) {
          setLanguages(prev => [...prev, { ...itemData, id: tempId }])
        } else {
          setLanguages(prev => prev.map(item => item.id === itemData.id ? itemData : item))
        }
        break
    }
    
    setEditingItem({ type: null, item: null, isNew: false })
    
      // Refresh validation immediately after saving an item
  setTimeout(() => {
    const updatedValidationErrors = validateForm()
    setValidationErrors(updatedValidationErrors)
  }, 100)
}

  const getEmptyItem = (type: 'career' | 'skill' | 'education' | 'certification' | 'language') => {
    switch (type) {
      case 'career':
        return {
          job_title: '',
          company_name: '',
          start_date: '',
          end_date: '',
          description: '',
          is_active: true,
        }
      case 'skill':
        return {
          skills: '',
          career_history_id: null,
          is_active: true,
        }
      case 'education':
        return {
          school: '',
          degree: '',
          field_of_study: '',
          start_date: '',
          end_date: '',
          grade: '',
          description: '',
          is_active: true,
        }
      case 'certification':
        return {
          license_certification_name: '',
          issuing_organisation: '',
          issue_date: '',
          expiry_date: '',
          is_no_expiry: false,
          description: '',
          is_active: true,
        }
      case 'language':
        return {
          language: '',
          proficiency_level: 'BASIC',
          is_active: true,
        }
      default:
        return {}
    }
  }

  // Validation function
  const validateForm = (): string[] => {
    const errors: string[] = []
    
    // Required basic fields
    if (!formData.first_name?.trim()) errors.push("First name is required")
    if (!formData.last_name?.trim()) errors.push("Last name is required")
    if (!formData.email?.trim()) errors.push("Email is required")
    
    // Email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address")
    }
    
    // Validate nested entities have required fields
    education.forEach((edu, index) => {
      if (!edu.school?.trim()) errors.push(`Education ${index + 1}: School name is required`)
      if (!edu.degree?.trim()) errors.push(`Education ${index + 1}: Degree is required`)
      if (!edu.field_of_study?.trim()) errors.push(`Education ${index + 1}: Field of Study is required`)
      if (!edu.start_date?.trim()) errors.push(`Education ${index + 1}: Start date is required`)
    })
    
    careerHistory.forEach((job, index) => {
      if (!job.job_title?.trim()) errors.push(`Career ${index + 1}: Job title is required`)
      if (!job.company_name?.trim()) errors.push(`Career ${index + 1}: Company name is required`)
      if (!job.start_date?.trim()) errors.push(`Career ${index + 1}: Start date is required`)
      if (!job.description?.trim()) errors.push(`Career ${index + 1}: Description is required`)
    })
    
    skills.forEach((skill, index) => {
      if (!skill.skills?.trim()) errors.push(`Skill ${index + 1}: Skill name is required`)
    })
    
    licensesCertifications.forEach((cert, index) => {
      if (!cert.license_certification_name?.trim()) errors.push(`Certification ${index + 1}: Name is required`)
      // Issuing Organization and Issue Date are now optional
    })
    
    languages.forEach((lang, index) => {
      if (!lang.language?.trim()) errors.push(`Language ${index + 1}: Language name is required`)
      // Proficiency level is now optional
      console.log(`Language ${index + 1} validation:`, {
        language: lang.language,
        proficiency_level: lang.proficiency_level,
        isValid: !!lang.language?.trim()
      })
    })
    
    console.log('Validation complete - Found errors:', errors)
    return errors
  }

  // Initial validation for parsed data to show users what needs attention
  const validateInitialParsedData = (data: Partial<CandidateProfile>): string[] => {
    const errors: string[] = []
    
    // Use the current nested entities state since they might have been loaded already
    const currentCareerHistory = careerHistory.length > 0 ? careerHistory : (data.career_history || [])
    const currentEducation = education.length > 0 ? education : (data.education || [])
    const currentLicensesCertifications = licensesCertifications.length > 0 ? licensesCertifications : (data.licenses_certifications || [])
    
    // Validate nested entities have required fields
    currentEducation.forEach((edu, index) => {
      if (!edu.school?.trim()) errors.push(`Education ${index + 1}: School name is required`)
      if (!edu.degree?.trim()) errors.push(`Education ${index + 1}: Degree is required`)
      if (!edu.field_of_study?.trim()) errors.push(`Education ${index + 1}: Field of Study is required`)
      if (!edu.start_date?.trim()) errors.push(`Education ${index + 1}: Start date is required`)
    })
    
    currentCareerHistory.forEach((job, index) => {
      if (!job.job_title?.trim()) errors.push(`Career ${index + 1}: Job title is required`)
      if (!job.company_name?.trim()) errors.push(`Career ${index + 1}: Company name is required`)
      if (!job.start_date?.trim()) errors.push(`Career ${index + 1}: Start date is required`)
      if (!job.description?.trim()) errors.push(`Career ${index + 1}: Description is required`)
    })
    
    currentLicensesCertifications.forEach((cert, index) => {
      if (!cert.license_certification_name?.trim()) errors.push(`Certification ${index + 1}: Name is required`)
      // Issuing Organization and Issue Date are now optional
    })
    
    return errors
  }

  const handleCreateProfile = async () => {
    try {
      // Validate form before submission
      const errors = validateForm()
      if (errors.length > 0) {
        setValidationErrors(errors)
        toast({
          title: "Validation Errors",
          description: `Please fix ${errors.length} error(s) before creating the profile.`,
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      setValidationErrors([])
      setStep("creating")

      // Combine basic form data with nested entities
      const completeFormData = {
        ...formData,
        career_history: careerHistory,
        skills: skills,
        education: education,
        licenses_certifications: licensesCertifications,
        languages: languages
      }

      // Create candidate profile with complete data
      const createResponse = await api.createFromParsedData({
        parsed_data: completeFormData,
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

      // Finalize with AI summary
      await api.updateCandidate(candidateId, {}, true)

      setStep("complete")

      toast({
        title: "Profile created successfully",
        description: "The candidate profile has been created and AI summary generated.",
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/candidates/${candidateId}`)
      }, 2000)
    } catch (error) {
      console.error("Profile creation error:", error)
      toast({
        title: "Creation failed",
        description: "Failed to create candidate profile. Please try again.",
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
        return 20
      case "parsing":
        return 40
      case "review":
        return 60
      case "creating":
        return 80
      case "finalizing":
        return 90
      case "complete":
        return 100
      default:
        return 0
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Create New Candidate"
        description="Upload and parse a resume or manually create a candidate profile"
      />

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">{getStepProgress()}%</span>
          </div>
          <Progress value={getStepProgress()} />
        </CardContent>
      </Card>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>Select a PDF resume to automatically extract candidate information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50 border-solid' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleClickUpload}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <h3 className="text-lg font-medium mb-2">
                {dragActive ? 'Drop PDF here' : 'Upload PDF Resume'}
              </h3>
              <p className="text-gray-600 mb-4">
                {dragActive ? 'Release to upload' : 'Drag and drop or click to select'}
              </p>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <Button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleClickUpload()
                }} 
                className="max-w-xs mx-auto"
                variant={dragActive ? "default" : "outline"}
              >
                Select File
              </Button>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-gray-500">({Math.round(selectedFile.size / 1024)} KB)</span>
                </div>
                <Button onClick={() => setSelectedFile(null)} variant="outline" size="sm">
                  Remove
                </Button>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/candidates")}>
                Cancel
              </Button>
              <Button onClick={handleParseResume} disabled={!selectedFile}>
                Parse Resume
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
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 text-sm flex items-center justify-between">
                  <span>⚠️ Required fields missing ({validationErrors.length} issue{validationErrors.length > 1 ? 's' : ''})</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const refreshedErrors = validateForm()
                        setValidationErrors(refreshedErrors)
                      }}
                      className="text-blue-600 hover:text-blue-700 h-auto p-1 text-xs"
                    >
                      🔄 Refresh
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setValidationErrors([])}
                      className="text-red-600 hover:text-red-700 h-auto p-1"
                    >
                      ✕
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600 mb-3">
                  Please complete the required fields below. You can edit them by clicking on the relevant tabs and using the "Edit" buttons.
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic" className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="career" className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2" />
                Career
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="education" className="flex items-center">
                <GraduationCap className="w-4 h-4 mr-2" />
                Education
              </TabsTrigger>
              <TabsTrigger value="certifications" className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                Licenses
              </TabsTrigger>
              <TabsTrigger value="languages" className="flex items-center">
                <LanguagesIcon className="w-4 h-4 mr-2" />
                Languages
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Personal and professional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <RequiredLabel htmlFor="first_name">First Name</RequiredLabel>
                      <Input
                        id="first_name"
                        value={formData.first_name || ""}
                        onChange={(e) => handleFormChange("first_name", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <RequiredLabel htmlFor="last_name">Last Name</RequiredLabel>
                      <Input
                        id="last_name"
                        value={formData.last_name || ""}
                        onChange={(e) => handleFormChange("last_name", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="chinese_name">Chinese Name</Label>
                      <Input
                        id="chinese_name"
                        value={formData.chinese_name || ""}
                        onChange={(e) => handleFormChange("chinese_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <RequiredLabel htmlFor="email">Email</RequiredLabel>
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
                    <div>
                      <Label htmlFor="sub_classification_of_interest">Role Tags</Label>
                      <MultiSelect
                        options={roleTagsOptions}
                        value={selectedRoleTags}
                        onChange={handleRoleTagsChange}
                        placeholder="Select from list or type custom tags..."
                        disabled={subClassificationLoading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Select from predefined role categories or type custom role tags and press Enter to add them.
                      </p>
                    </div>
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
                      <Label htmlFor="preferred_work_types">Preferred Work Types</Label>
                      <MultiSelect
                        options={workTypesOptions}
                        value={selectedWorkTypes}
                        onChange={handleWorkTypesChange}
                        placeholder="Select work types..."
                        disabled={workTypesLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="availability_weeks">Availability (weeks)</Label>
                      <Input
                        id="availability_weeks"
                        type="number"
                        value={formData.availability_weeks || ""}
                        onChange={(e) => handleFormChange("availability_weeks", Number.parseInt(e.target.value))}
                        min="0"
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
            </TabsContent>

            {/* Career History Tab */}
            <TabsContent value="career">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Career History
                    <Button onClick={() => handleCreateItem('career')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Work experience and employment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {careerHistory && careerHistory.length > 0 ? (
                    <div className="space-y-4">
                      {careerHistory.map((job, index) => (
                        <div key={job.id || index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{job.job_title}</h4>
                              <p className="text-sm text-gray-600">{job.company_name}</p>
                              <div className="text-sm text-gray-500">
                                {job.start_date} - {job.end_date || "Present"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditItem('career', job)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem('career', index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {job.description && (
                            <p className="text-sm text-gray-700">{job.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No career history available</p>
                      <Button onClick={() => handleCreateItem('career')} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Experience
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Skills
                    <Button onClick={() => handleCreateItem('skill')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Skill
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Technical and soft skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {skills && skills.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {skills.map((skill, index) => (
                        <div key={skill.id || index} className="p-3 border rounded-lg flex justify-between items-center">
                          <span className="text-sm font-medium">{skill.skills}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem('skill', skill)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem('skill', index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No skills available</p>
                      <Button onClick={() => handleCreateItem('skill')} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Skill
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Education
                    <Button onClick={() => handleCreateItem('education')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Academic background and qualifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {education && education.length > 0 ? (
                    <div className="space-y-4">
                      {education.map((edu, index) => (
                        <div key={edu.id || index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">
                                {edu.degree} in {edu.field_of_study}
                              </h4>
                              <p className="text-sm text-gray-600">{edu.school}</p>
                              {edu.grade && (
                                <p className="text-sm text-gray-500">Grade: {edu.grade}</p>
                              )}
                              <div className="text-sm text-gray-500">
                                {edu.start_date} - {edu.end_date || "Present"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditItem('education', edu)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem('education', index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {edu.description && (
                            <p className="text-sm text-gray-700">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No education records available</p>
                      <Button onClick={() => handleCreateItem('education')} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Education
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Licenses & Certifications
                    <Button onClick={() => handleCreateItem('certification')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Certification
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Professional certifications and licenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {licensesCertifications && licensesCertifications.length > 0 ? (
                    <div className="space-y-4">
                      {licensesCertifications.map((cert, index) => (
                        <div key={cert.id || index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{cert.license_certification_name}</h4>
                              <p className="text-sm text-gray-600">{cert.issuing_organisation}</p>
                              <div className="text-sm text-gray-500">
                                {cert.issue_date}
                                {cert.expiry_date && !cert.is_no_expiry && (
                                  <> - {cert.expiry_date}</>
                                )}
                                {cert.is_no_expiry && (
                                  <Badge variant="secondary" className="ml-2">No Expiry</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditItem('certification', cert)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem('certification', index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {cert.description && (
                            <p className="text-sm text-gray-700">{cert.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No certifications available</p>
                      <Button onClick={() => handleCreateItem('certification')} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Certification
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Languages Tab */}
            <TabsContent value="languages">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Languages
                    <Button onClick={() => handleCreateItem('language')} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Language
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Language skills and proficiency levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {languages && languages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {languages.map((lang, index) => (
                        <div key={lang.id || index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="font-medium">{lang.language}</span>
                              <Badge variant="outline" className="ml-2">{lang.proficiency_level}</Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem('language', lang)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem('language', index)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No language information available</p>
                      <Button onClick={() => handleCreateItem('language')} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Language
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back to Upload
            </Button>
            <Button
              onClick={handleCreateProfile}
              disabled={validationErrors.length > 0}
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
              <p className="text-gray-600">Setting up the candidate profile with all information...</p>
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
              <h3 className="text-lg font-medium mb-2">Finalizing with AI</h3>
              <p className="text-gray-600">Generating AI summary and embeddings...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Complete */}
      {step === "complete" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-medium mb-2">Profile Created Successfully!</h3>
              <p className="text-gray-600 mb-6">
                The candidate profile has been created with AI-powered summary and embeddings.
              </p>
              <p className="text-sm text-gray-500">Redirecting to candidate profile...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entity CRUD Modal */}
      <CandidateEntityModal
        isOpen={editingItem.type !== null}
        onClose={() => setEditingItem({ type: null, item: null, isNew: false })}
        onSave={(data, isNew) => editingItem.type && handleSaveItem(editingItem.type, data, isNew)}
        type={editingItem.type}
        item={editingItem.item}
        isNew={editingItem.isNew}
      />
    </div>
  )
} 