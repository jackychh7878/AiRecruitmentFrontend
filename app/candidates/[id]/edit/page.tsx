"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { api, type CandidateProfile, type CareerHistory, type Skills, type Education, type LicenseCertification, type Language, convertStringToArray, convertArrayToString } from "@/lib/api"
import { useCitizenshipCodes, useClassificationCodes, /* useSubClassificationCodes, */ usePreferredWorkTypesCodes } from "@/hooks/use-lookup-codes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { CandidateEntityModal } from "@/components/candidate-entity-modal"
import { 
  Save, 
  Loader2, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages as LanguagesIcon, 
  FileText,
  AlertTriangle,
  Check,
  Plus,
  Edit,
  Trash2
} from "lucide-react"
import Link from "next/link"

export default function EditCandidatePage() {
  const params = useParams()
  const router = useRouter()
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [formData, setFormData] = useState<Partial<CandidateProfile>>({})
  const { toast } = useToast()

  // Fetch lookup codes dynamically
  const { codes: citizenshipCodes, loading: citizenshipLoading } = useCitizenshipCodes()
  const { codes: classificationCodes, loading: classificationLoading } = useClassificationCodes()
  // const { codes: subClassificationCodes, loading: subClassificationLoading } = useSubClassificationCodes()
  const { codes: workTypesCodes, loading: workTypesLoading } = usePreferredWorkTypesCodes()

  // Convert work types for multi-select
  const selectedWorkTypes = convertStringToArray(formData.preferred_work_types)
  const workTypesOptions = workTypesCodes.map(code => ({ value: code.com_code, label: code.com_code }))

  // State for nested entities
  const [careerHistory, setCareerHistory] = useState<CareerHistory[]>([])
  const [skills, setSkills] = useState<Skills[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [licensesCertifications, setLicensesCertifications] = useState<LicenseCertification[]>([])
  const [languages, setLanguages] = useState<Language[]>([])

  // Modal states for CRUD operations
  const [editingItem, setEditingItem] = useState<{
    type: 'career' | 'skill' | 'education' | 'certification' | 'language' | null
    item: any
    isNew: boolean
  }>({ type: null, item: null, isNew: false })

  const candidateId = Number.parseInt(params.id as string)

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        setLoading(true)
        const response = await api.getCandidate(candidateId, true)
        setCandidate(response)
        setFormData(response)
        
        // Load nested entities from the candidate response
        setCareerHistory(response.career_history || [])
        setSkills(response.skills || [])
        setEducation(response.education || [])
        setLicensesCertifications(response.licenses_certifications || [])
        setLanguages(response.languages || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load candidate details",
          variant: "destructive",
        })
        router.push("/candidates")
      } finally {
        setLoading(false)
      }
    }

    if (candidateId) {
      loadCandidate()
    }
  }, [candidateId, router, toast])

  const handleInputChange = (field: keyof CandidateProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleWorkTypesChange = (values: string[]) => {
    const joinedValues = convertArrayToString(values)
    handleInputChange("preferred_work_types", joinedValues)
  }

  // CRUD handlers for nested entities
  const handleCreateItem = (type: 'career' | 'skill' | 'education' | 'certification' | 'language') => {
    const newItem = getEmptyItem(type)
    setEditingItem({ type, item: newItem, isNew: true })
  }

  const handleEditItem = (type: 'career' | 'skill' | 'education' | 'certification' | 'language', item: any) => {
    setEditingItem({ type, item, isNew: false })
  }

  const handleDeleteItem = async (type: 'career' | 'skill' | 'education' | 'certification' | 'language', itemId: number) => {
    try {
      switch (type) {
        case 'career':
          await api.deleteCareerHistory(candidateId, itemId)
          setCareerHistory(prev => prev.filter(item => item.id !== itemId))
          break
        case 'skill':
          await api.deleteSkill(candidateId, itemId)
          setSkills(prev => prev.filter(item => item.id !== itemId))
          break
        case 'education':
          await api.deleteEducation(candidateId, itemId)
          setEducation(prev => prev.filter(item => item.id !== itemId))
          break
        case 'certification':
          await api.deleteLicenseCertification(candidateId, itemId)
          setLicensesCertifications(prev => prev.filter(item => item.id !== itemId))
          break
        case 'language':
          await api.deleteLanguage(candidateId, itemId)
          setLanguages(prev => prev.filter(item => item.id !== itemId))
          break
      }
      
      setHasChanges(true)
      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const handleSaveItem = async (type: 'career' | 'skill' | 'education' | 'certification' | 'language', itemData: any, isNew: boolean) => {
    try {
      let savedItem: any
      
      switch (type) {
        case 'career':
          if (isNew) {
            savedItem = await api.createCareerHistory(candidateId, itemData)
            setCareerHistory(prev => [...prev, savedItem])
          } else {
            savedItem = await api.updateCareerHistory(candidateId, itemData.id, itemData)
            setCareerHistory(prev => prev.map(item => item.id === itemData.id ? savedItem : item))
          }
          break
        case 'skill':
          if (isNew) {
            savedItem = await api.createSkill(candidateId, itemData)
            setSkills(prev => [...prev, savedItem])
          } else {
            savedItem = await api.updateSkill(candidateId, itemData.id, itemData)
            setSkills(prev => prev.map(item => item.id === itemData.id ? savedItem : item))
          }
          break
        case 'education':
          if (isNew) {
            savedItem = await api.createEducation(candidateId, itemData)
            setEducation(prev => [...prev, savedItem])
          } else {
            savedItem = await api.updateEducation(candidateId, itemData.id, itemData)
            setEducation(prev => prev.map(item => item.id === itemData.id ? savedItem : item))
          }
          break
        case 'certification':
          if (isNew) {
            savedItem = await api.createLicenseCertification(candidateId, itemData)
            setLicensesCertifications(prev => [...prev, savedItem])
          } else {
            savedItem = await api.updateLicenseCertification(candidateId, itemData.id, itemData)
            setLicensesCertifications(prev => prev.map(item => item.id === itemData.id ? savedItem : item))
          }
          break
        case 'language':
          if (isNew) {
            savedItem = await api.createLanguage(candidateId, itemData)
            setLanguages(prev => [...prev, savedItem])
          } else {
            savedItem = await api.updateLanguage(candidateId, itemData.id, itemData)
            setLanguages(prev => prev.map(item => item.id === itemData.id ? savedItem : item))
          }
          break
      }
      
      setHasChanges(true)
      setEditingItem({ type: null, item: null, isNew: false })
      toast({
        title: "Success",
        description: `${isNew ? 'Created' : 'Updated'} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isNew ? 'create' : 'update'} item`,
        variant: "destructive",
      })
    }
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

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.updateCandidate(candidateId, formData)
      
      toast({
        title: "Success",
        description: "Candidate profile updated successfully",
      })
      
      setHasChanges(false)
      
      // Reload the data to reflect changes
      const updatedCandidate = await api.getCandidate(candidateId, true)
      setCandidate(updatedCandidate)
      setFormData(updatedCandidate)
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update candidate profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async () => {
    try {
      setSaving(true)
      await api.updateCandidate(candidateId, formData, true) // Generate AI summary
      
      toast({
        title: "Success",
        description: "Profile finalized and AI summary generated",
      })
      
      setHasChanges(false)
      router.push(`/candidates/${candidateId}`)
      
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to finalize profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadResume = async (resumeId: number, fileName: string) => {
    try {
      const blob = await api.downloadResume(resumeId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Resume downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download resume",
        variant: "destructive",
      })
    }
  }

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Please save or finalize the profile before leaving.'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Candidate not found</h2>
          <p className="text-gray-600 mt-2">The candidate you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/candidates")} className="mt-4">
            Back to Candidates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <PageHeader
        title={`Edit ${candidate.first_name} ${candidate.last_name}`}
        description="Update candidate profile information and relationships"
      >
        <div className="flex space-x-2">
          <Link href={`/candidates/${candidate.id}`}>
            <Button variant="outline">
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
          <Button onClick={handleFinalize} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Finalize Profile
          </Button>
        </div>
      </PageHeader>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You have unsaved changes. Make sure to save or finalize the profile before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
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
          <TabsTrigger value="resumes" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Resumes
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the candidate's personal and professional details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ""}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ""}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number || ""}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="salary_expectation">Salary Expectation</Label>
                  <Input
                    id="salary_expectation"
                    type="number"
                    value={formData.salary_expectation || ""}
                    onChange={(e) => handleInputChange("salary_expectation", Number.parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Professional Information */}
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classification_of_interest">Classification</Label>
                  <Select
                    value={formData.classification_of_interest || "not-specified"}
                    onValueChange={(value) => handleInputChange("classification_of_interest", value === "not-specified" ? "" : value)}
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
                    onValueChange={(value) => handleInputChange("sub_classification_of_interest", value === "not-specified" ? "" : value)}
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
                    onValueChange={(value) => handleInputChange("citizenship", value === "not-specified" ? "" : value)}
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
                    onChange={(e) => handleInputChange("availability_weeks", Number.parseInt(e.target.value))}
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

              {/* Summary */}
              <Separator />
              <div>
                <Label htmlFor="personal_summary">Personal Summary</Label>
                <Textarea
                  id="personal_summary"
                  value={formData.personal_summary || ""}
                  onChange={(e) => handleInputChange("personal_summary", e.target.value)}
                  rows={4}
                />
              </div>

              {/* Right to Work */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="right_to_work"
                  checked={formData.right_to_work || false}
                  onCheckedChange={(checked) => handleInputChange("right_to_work", checked)}
                />
                <Label htmlFor="right_to_work">Has right to work</Label>
              </div>

              {/* Remarks */}
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks || ""}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
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
                Manage work experience and related skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              {careerHistory && careerHistory.length > 0 ? (
                <div className="space-y-4">
                  {careerHistory.map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg">
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
                            onClick={() => handleDeleteItem('career', job.id)}
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
                  {skills.map((skill) => (
                    <div key={skill.id} className="p-3 border rounded-lg flex justify-between items-center">
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
                          onClick={() => handleDeleteItem('skill', skill.id)}
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
                  {education.map((edu) => (
                    <div key={edu.id} className="p-4 border rounded-lg">
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
                            onClick={() => handleDeleteItem('education', edu.id)}
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
                  {licensesCertifications.map((cert) => (
                    <div key={cert.id} className="p-4 border rounded-lg">
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
                            onClick={() => handleDeleteItem('certification', cert.id)}
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
                  {languages.map((lang) => (
                    <div key={lang.id} className="p-3 border rounded-lg">
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
                            onClick={() => handleDeleteItem('language', lang.id)}
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

        {/* Resumes Tab */}
        <TabsContent value="resumes">
          <Card>
            <CardHeader>
              <CardTitle>Resumes</CardTitle>
              <CardDescription>
                Uploaded resume files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.resumes && candidate.resumes.length > 0 ? (
                <div className="space-y-3">
                  {candidate.resumes.map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">{resume.file_name}</div>
                          <div className="text-xs text-gray-500">
                            {Math.round(resume.file_size / 1024)} KB • {resume.content_type}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadResume(resume.id, resume.file_name)}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No resumes uploaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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