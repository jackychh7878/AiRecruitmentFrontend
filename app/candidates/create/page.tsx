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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CandidateEntityModal } from "@/components/candidate-entity-modal"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, User, Briefcase, Award, GraduationCap, Languages as LanguagesIcon, Plus, Edit, Trash2, Users, Eye, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"

type CreationStep = "upload" | "parsing" | "review" | "creating" | "finalizing" | "complete"
type CreationMode = "single" | "batch"

// Component for required field labels with red asterisk
const RequiredLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
  <Label htmlFor={htmlFor} className="flex items-center gap-1">
    {children}
    <span className="text-red-500">*</span>
  </Label>
)

export default function CreateCandidatePage() {
  // Mode selection
  const [mode, setMode] = useState<CreationMode>("single")
  
  // Single file mode states
  const [step, setStep] = useState<CreationStep>("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Partial<CandidateProfile> | null>(null)
  const [confidenceScore, setConfidenceScore] = useState<number>(0)
  const [formData, setFormData] = useState<Partial<CandidateProfile>>({})
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  // Batch mode states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batchConfig, setBatchConfig] = useState<any>(null)
  const [batchJobId, setBatchJobId] = useState<string | null>(null)
  const [batchJobStatus, setBatchJobStatus] = useState<any>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  
  // Job history state (replaces batchJobs)
  const [jobHistory, setJobHistory] = useState<any[]>([])
  const [historyPagination, setHistoryPagination] = useState<any>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  
  // Failed files modal state
  const [failedFilesModal, setFailedFilesModal] = useState<{
    isOpen: boolean
    jobId: string | null
    data: any | null
  }>({
    isOpen: false,
    jobId: null,
    data: null
  })
  
  // Statistics state
  const [statistics, setStatistics] = useState<any>(null)
  const [statisticsLoading, setStatisticsLoading] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

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

  // Load batch upload configuration
  useEffect(() => {
    const loadBatchConfig = async () => {
      if (mode === "batch") {
        try {
          const config = await api.getBatchUploadConfig()
          setBatchConfig(config)
        } catch (error) {
          console.error("Failed to load batch config:", error)
          toast({
            title: "Configuration Error",
            description: "Failed to load batch upload configuration",
            variant: "destructive"
          })
        }
      }
    }
    
    loadBatchConfig()
  }, [mode, toast])

  // Load job history
  const loadJobHistory = async () => {
    if (mode === "batch") {
      try {
        setHistoryLoading(true)
        const response = await api.getBatchJobHistory({
          status: statusFilter || undefined,
          per_page: 10,
          page: currentPage
        })
        setJobHistory(response.jobs)
        setHistoryPagination(response.pagination)
      } catch (error) {
        console.error("Failed to load job history:", error)
        toast({
          title: "Failed to load job history",
          description: "There was an error loading the job history. Please try again.",
          variant: "destructive"
        })
      } finally {
        setHistoryLoading(false)
      }
    }
  }

  // Load statistics
  const loadStatistics = async () => {
    try {
      setStatisticsLoading(true)
      const response = await api.getBatchStatistics()
      setStatistics(response)
    } catch (error) {
      console.error("Failed to load statistics:", error)
    } finally {
      setStatisticsLoading(false)
    }
  }

  // Load failed files for a job
  const loadFailedFiles = async (jobId: string) => {
    try {
      const response = await api.getBatchJobFailedFiles(jobId)
      setFailedFilesModal({
        isOpen: true,
        jobId,
        data: response
      })
    } catch (error) {
      console.error("Failed to load failed files:", error)
      toast({
        title: "Failed to load failed files",
        description: "There was an error loading the failed files information.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadJobHistory()
  }, [mode, statusFilter, currentPage])

  useEffect(() => {
    if (mode === "batch") {
      loadStatistics()
      
      // Set up polling for statistics and job history
      const interval = setInterval(() => {
        loadJobHistory()
        loadStatistics()
      }, 10000) // Poll every 10 seconds
      
      return () => clearInterval(interval)
    }
  }, [mode])

  // Simplified job status tracking - just show immediate feedback and rely on history polling
  useEffect(() => {
    if (batchJobId && mode === "batch") {
      // For database-persisted jobs, we just need to show immediate status
      // and let the history polling handle updates
      setBatchJobStatus({
        job_id: batchJobId,
        status: "processing",
        created_at: new Date().toISOString(),
        total_files: selectedFiles.length || 0,
        processed_files: 0,
        successful_profiles: 0,
        failed_files: 0,
        progress_percentage: 0,
        processing_time_seconds: 0,
        errors: [],
        results: []
      })

      // Clear the job tracking after a short delay to let history polling take over
      const timeout = setTimeout(() => {
        setBatchJobId(null)
        setBatchJobStatus(null)
        // Trigger an immediate history refresh
        loadJobHistory()
      }, 5000) // Clear after 5 seconds

      return () => clearTimeout(timeout)
    }
  }, [batchJobId, mode, selectedFiles.length])

  // Batch file handlers
  const handleBatchFilesSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    // Validate file types
    const invalidFiles = fileArray.filter(file => !file.name.toLowerCase().endsWith('.pdf'))
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: `Only PDF files are allowed. Found ${invalidFiles.length} non-PDF file(s).`,
        variant: "destructive"
      })
      return
    }
    
    // Check limits
    if (batchConfig) {
      if (fileArray.length > batchConfig.limits.max_files_per_batch) {
        toast({
          title: "Too many files",
          description: `Maximum ${batchConfig.limits.max_files_per_batch} files allowed per batch`,
          variant: "destructive"
        })
        return
      }
      
      const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0)
      if (totalSize > batchConfig.limits.batch_upload_limit_bytes) {
        toast({
          title: "Total size too large",
          description: `Total size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${batchConfig.limits.batch_upload_limit_mb}MB`,
          variant: "destructive"
        })
        return
      }
      
      // Check individual file sizes
      const oversizedFiles = fileArray.filter(file => file.size > batchConfig.limits.individual_file_limit_bytes)
      if (oversizedFiles.length > 0) {
        toast({
          title: "Files too large",
          description: `${oversizedFiles.length} file(s) exceed the ${batchConfig.limits.individual_file_limit_mb}MB individual file limit`,
          variant: "destructive"
        })
        return
      }
    }
    
    setSelectedFiles(fileArray)
  }

  const handleBatchDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleBatchFilesSelect(files)
    }
  }

  const handleBatchFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Convert to array and combine with existing files
      const newFiles = Array.from(files)
      const combinedFiles = [...selectedFiles, ...newFiles]
      
      // Remove duplicates based on file name and size
      const uniqueFiles = combinedFiles.filter((file, index, self) => 
        index === self.findIndex(f => f.name === file.name && f.size === file.size)
      )
      
      handleBatchFilesSelect(uniqueFiles)
    }
    
    // Reset the input value to allow selecting the same files again if needed
    e.target.value = ''
  }

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to upload",
        variant: "destructive"
      })
      return
    }
    
    try {
      setBatchLoading(true)
      
      toast({
        title: "Starting upload",
        description: `Uploading ${selectedFiles.length} files for batch processing...`,
      })
      
      const response = await api.batchParseResumes(selectedFiles)
      
      if (response.success) {
        console.log(`Created batch job: ${response.job_id}`)
        
        setBatchJobId(response.job_id)
        setBatchJobStatus({
          job_id: response.job_id,
          batch_number: response.batch_number,
          status: "processing",
          total_files: response.total_files,
          processed_files: 0,
          successful_profiles: 0,
          completed_profiles: 0,
          incomplete_profiles: 0,
          failed_files: 0,
          ai_summaries_generated: 0,
          ai_summaries_failed: 0,
          classifications_generated: 0,
          classifications_failed: 0,
          progress_percentage: 0,
          processing_time_seconds: 0,
          errors: [],
          results: [],
          created_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          completed_at: "",
          batch_upload_datetime: new Date().toISOString()
        })
        
        toast({
          title: "Batch upload started",
          description: `Processing ${response.total_files} files. Job ID: ${response.job_id}`,
        })
        
        // Clear selected files
        setSelectedFiles([])
        
        // Reload job history to include this new job
        try {
          loadJobHistory()
        } catch (jobsError) {
          console.error("Failed to reload job history after upload:", jobsError)
        }
      } else {
        throw new Error(response.message || "Batch upload failed")
      }
    } catch (error) {
      console.error("Batch upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to start batch processing",
        variant: "destructive"
      })
      
      // Clear job states on error
      setBatchJobId(null)
      setBatchJobStatus(null)
    } finally {
      setBatchLoading(false)
    }
  }

  const removeBatchFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  const cancelBatchJob = async (jobId: string) => {
    try {
      await api.cancelBatchJob(jobId)
      toast({
        title: "Job cancelled",
        description: `Batch job ${jobId} has been cancelled`
      })
      
      // Reload job history
      loadJobHistory()
      
      // Clear current job if it's the one we cancelled
      if (batchJobId === jobId) {
        setBatchJobId(null)
        setBatchJobStatus(null)
      }
    } catch (error) {
      toast({
        title: "Cancel failed",
        description: "Failed to cancel batch job",
        variant: "destructive"
      })
    }
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
        description={mode === "single" 
          ? "Upload and parse a resume or manually create a candidate profile"
          : "Upload multiple PDF resumes for batch processing and automatic profile creation"
        }
      />

      {/* Mode Toggle */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <Label htmlFor="mode-toggle" className="font-medium">Single Profile</Label>
              </div>
              <Switch
                id="mode-toggle"
                checked={mode === "batch"}
                onCheckedChange={(checked) => {
                  setMode(checked ? "batch" : "single")
                  // Reset states when switching modes
                  if (checked) {
                    setStep("upload")
                    setSelectedFile(null)
                    setParsedData(null)
                    setFormData({})
                  } else {
                    setSelectedFiles([])
                    setBatchJobId(null)
                    setBatchJobStatus(null)
                  }
                }}
              />
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <Label htmlFor="mode-toggle" className="font-medium">Batch Processing</Label>
              </div>
            </div>
            
            {mode === "batch" && batchConfig && (
              <div className="text-sm text-gray-600">
                Max: {batchConfig.limits.max_files_per_batch} files, {batchConfig.limits.batch_upload_limit_mb}MB total
              </div>
            )}
          </div>
          
          {mode === "batch" && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Batch mode will automatically parse resumes, generate AI summaries, and create complete candidate profiles in the background. 
                Individual file limit: {batchConfig?.limits.individual_file_limit_mb || 10}MB, 
                Batch limit: {batchConfig?.limits.batch_upload_limit_mb || 100}MB total.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Progress Bar - Only show for single mode */}
      {mode === "single" && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">{getStepProgress()}%</span>
            </div>
            <Progress value={getStepProgress()} />
          </CardContent>
        </Card>
      )}

      {/* Single Mode Upload */}
      {mode === "single" && step === "upload" && (
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

      {/* Batch Mode Upload */}
      {mode === "batch" && (
        <div className="space-y-6">
          {/* File Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Upload PDF Resumes</CardTitle>
              <CardDescription>
                Upload multiple PDF resumes for automatic processing and profile creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? 'border-green-500 bg-green-50 border-solid' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleBatchDrop}
                onClick={() => batchFileInputRef.current?.click()}
              >
                <Users className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-green-500' : 'text-gray-400'}`} />
                <h3 className="text-lg font-medium mb-2">
                  {dragActive ? 'Drop PDF files here' : 'Upload Multiple PDF Resumes'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {dragActive ? 'Release to upload files' : 'Drag and drop or click to select multiple PDF files'}
                </p>
                {batchConfig && (
                  <p className="text-sm text-gray-500 mb-4">
                    Max {batchConfig.limits.max_files_per_batch} files • {batchConfig.limits.individual_file_limit_mb}MB per file • {batchConfig.limits.batch_upload_limit_mb}MB total
                  </p>
                )}
                <Input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleBatchFileInput}
                  ref={batchFileInputRef}
                  className="hidden"
                />
                <Button 
                  onClick={(e) => {
                    e.stopPropagation()
                    batchFileInputRef.current?.click()
                  }} 
                  className="max-w-xs mx-auto"
                  variant={dragActive ? "default" : "outline"}
                >
                  Select Files
                </Button>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <span className="font-medium">{file.name}</span>
                            <div className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => removeBatchFile(index)} 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Total: {(selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedFiles([])}
                        disabled={batchLoading}
                      >
                        Clear All
                      </Button>
                      <Button 
                        onClick={handleBatchUpload}
                        disabled={selectedFiles.length === 0 || batchLoading}
                      >
                        {batchLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          `Process ${selectedFiles.length} Files`
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Job Status */}
          {batchJobStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Current Job Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Job ID: {batchJobStatus.job_id}</div>
                      <div className="text-sm text-gray-600">Batch: {batchJobStatus.batch_number}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        batchJobStatus.status === "completed" ? "default" :
                        batchJobStatus.status === "failed" ? "destructive" :
                        batchJobStatus.status === "processing" ? "secondary" : "outline"
                      }>
                        {batchJobStatus.status}
                      </Badge>
                      {batchJobStatus.status === "processing" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelBatchJob(batchJobStatus.job_id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{batchJobStatus.progress_percentage}%</span>
                    </div>
                    <Progress value={batchJobStatus.progress_percentage} />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{batchJobStatus.processed_files}</div>
                      <div className="text-gray-600">Processed</div>
                    </div>
                    <div>
                      <div className="font-medium">{batchJobStatus.successful_profiles}</div>
                      <div className="text-gray-600">Successful</div>
                    </div>
                    <div>
                      <div className="font-medium">{batchJobStatus.completed_profiles}</div>
                      <div className="text-gray-600">Complete</div>
                    </div>
                    <div>
                      <div className="font-medium">{batchJobStatus.failed_files}</div>
                      <div className="text-gray-600">Failed</div>
                    </div>
                  </div>
                  
                  {batchJobStatus.errors && batchJobStatus.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-1">Errors encountered:</div>
                        <ul className="list-disc list-inside text-sm">
                          {batchJobStatus.errors.slice(0, 3).map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                          {batchJobStatus.errors.length > 3 && (
                            <li>... and {batchJobStatus.errors.length - 3} more</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics Dashboard */}
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Batch Processing Statistics</CardTitle>
                <CardDescription>
                  Overview of all batch resume processing activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Job Statistics */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">Job Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Jobs:</span>
                        <span className="font-medium">{statistics.job_statistics.total_jobs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate:</span>
                        <span className="font-medium text-green-600">
                          {statistics.job_statistics.job_success_rate_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Recent (24h):</span>
                        <span className="font-medium">{statistics.job_statistics.recent_jobs_24h}</span>
                      </div>
                    </div>
                  </div>

                  {/* File Processing */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">File Processing</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Files Processed:</span>
                        <span className="font-medium">{statistics.file_processing_statistics.total_files_processed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate:</span>
                        <span className="font-medium text-green-600">
                          {statistics.file_processing_statistics.file_success_rate_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Profiles Created:</span>
                        <span className="font-medium text-blue-600">{statistics.file_processing_statistics.total_successful_profiles}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Processing */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">AI Processing</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Summaries:</span>
                        <span className="font-medium text-purple-600">{statistics.ai_processing_statistics.ai_summaries_generated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Classifications:</span>
                        <span className="font-medium text-purple-600">{statistics.ai_processing_statistics.classifications_generated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">AI Success:</span>
                        <span className="font-medium text-green-600">
                          {statistics.ai_processing_statistics.ai_summary_success_rate_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job History */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Job History</CardTitle>
              <CardDescription>
                Complete history of batch resume processing jobs
              </CardDescription>
              {/* Status Filter */}
              <div className="flex gap-2 mt-4">
                <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading job history...</div>
                </div>
              ) : jobHistory.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {jobHistory.map((job) => (
                      <div key={job.job_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{job.batch_number}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {job.total_files} files • {job.successful_profiles} successful • {job.failed_files} failed
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(job.created_at).toLocaleString()}
                            {job.completed_at && (
                              <span className="ml-2">
                                • Completed in {job.processing_time_seconds.toFixed(1)}s
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            job.status === "completed" ? "default" :
                            job.status === "failed" ? "destructive" :
                            job.status === "processing" ? "secondary" : 
                            job.status === "cancelled" ? "outline" : "outline"
                          }>
                            {job.status}
                          </Badge>
                          {job.status === "processing" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => cancelBatchJob(job.job_id)}
                            >
                              Cancel
                            </Button>
                          )}
                          {job.failed_files > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => loadFailedFiles(job.job_id)}
                            >
                              View Errors
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {historyPagination && historyPagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500">
                        Showing {((historyPagination.page - 1) * historyPagination.per_page) + 1} to{" "}
                        {Math.min(historyPagination.page * historyPagination.per_page, historyPagination.total)} of{" "}
                        {historyPagination.total} jobs
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!historyPagination.has_prev}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!historyPagination.has_next}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No batch jobs found.</p>
                  <p className="text-sm mt-1">Start your first batch upload to see job history here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Single Mode Steps - Only show when in single mode */}
      {mode === "single" && step === "parsing" && (
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
      {mode === "single" && step === "review" && parsedData && (
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
      {mode === "single" && step === "creating" && (
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
      {mode === "single" && step === "finalizing" && (
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
      {mode === "single" && step === "complete" && (
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

      {/* Failed Files Modal */}
      <Dialog open={failedFilesModal.isOpen} onOpenChange={(open) => setFailedFilesModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Failed Files Report</DialogTitle>
            <DialogDescription>
              {failedFilesModal.data && (
                <>
                  Details for batch job: {failedFilesModal.data.batch_number} 
                  ({failedFilesModal.data.total_failed_files} failed files)
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {failedFilesModal.data && (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {failedFilesModal.data.failed_files.map((file: any, index: number) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{file.original_filename}</h4>
                        <div className="text-xs text-gray-500 mt-1">
                          Size: {(file.file_size / 1024).toFixed(1)} KB • 
                          Stage: {file.failure_stage} • 
                          Method: {file.parsing_method} •
                          Time: {new Date(file.attempted_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        {file.error_type}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Error Details:</h5>
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border max-h-24 overflow-y-auto">
                        {file.failure_reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setFailedFilesModal({ isOpen: false, jobId: null, data: null })}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 