"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { api, type CandidateProfile } from "@/lib/api"
import {
  Edit,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  GraduationCap,
  Languages,
  FileText,
  Loader2,
  Download,
} from "lucide-react"
import Link from "next/link"

export default function CandidateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const candidateId = Number.parseInt(params.id as string)

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        setLoading(true)
        const response = await api.getCandidate(candidateId, true)
        setCandidate(response)
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
        title={`${candidate.first_name} ${candidate.last_name}`}
        description={candidate.classification_of_interest || "Candidate Profile"}
      >
        <Link href={`/candidates/${candidate.id}/edit`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarFallback className="text-2xl">
                  {candidate.first_name[0]}
                  {candidate.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">
                {candidate.first_name} {candidate.last_name}
              </CardTitle>
              <CardDescription>{candidate.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.phone_number && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{candidate.phone_number}</span>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{candidate.location}</span>
                </div>
              )}
              {candidate.salary_expectation && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">${candidate.salary_expectation.toLocaleString()}</span>
                </div>
              )}
              {candidate.availability_weeks && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Available in {candidate.availability_weeks} weeks</span>
                </div>
              )}
              {candidate.citizenship && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{candidate.citizenship}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Classifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.classification_of_interest && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Primary</Label>
                  <Badge className="ml-2">{candidate.classification_of_interest}</Badge>
                </div>
              )}
              {/* Temporarily commented out Sub-classification display */}
              {/* {candidate.sub_classification_of_interest && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Secondary</Label>
                  <Badge variant="outline" className="ml-2">
                    {candidate.sub_classification_of_interest}
                  </Badge>
                </div>
              )} */}
              {candidate.preferred_work_types && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Work Preferences</Label>
                  <div className="mt-1">
                    {candidate.preferred_work_types.split(",").map((type, index) => (
                      <Badge key={index} variant="secondary" className="mr-1 mb-1">
                        {type.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumes */}
          {candidate.resumes && candidate.resumes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Resumes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candidate.resumes.map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">{resume.file_name}</div>
                          <div className="text-xs text-gray-500">{Math.round(resume.file_size / 1024)} KB</div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadResume(resume.id, resume.file_name)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          {candidate.ai_short_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{candidate.ai_short_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Personal Summary */}
          {candidate.personal_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{candidate.personal_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Career History */}
          {candidate.career_history && candidate.career_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Career History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidate.career_history.map((job, index) => (
                    <div key={job.id}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{job.job_title}</h4>
                          <p className="text-sm text-gray-600">{job.company_name}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.start_date} - {job.end_date || "Present"}
                        </div>
                      </div>
                      {job.description && <p className="text-sm text-gray-700 mb-2">{job.description}</p>}
                      {index < candidate.career_history!.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidate.skills.map((skillSet) => (
                    <div key={skillSet.id}>
                      <div className="flex flex-wrap gap-2">
                        {skillSet.skills.split(",").map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {candidate.education && candidate.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">
                            {edu.degree} in {edu.field_of_study}
                          </h4>
                          <p className="text-sm text-gray-600">{edu.school}</p>
                          {edu.grade && <p className="text-sm text-gray-500">Grade: {edu.grade}</p>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {edu.start_date} - {edu.end_date || "Present"}
                        </div>
                      </div>
                      {edu.description && <p className="text-sm text-gray-700">{edu.description}</p>}
                      {index < candidate.education!.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Languages */}
          {candidate.languages && candidate.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Languages className="w-5 h-5 mr-2" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {candidate.languages.map((lang) => (
                    <div key={lang.id} className="flex justify-between">
                      <span className="font-medium">{lang.language}</span>
                      <Badge variant="outline">{lang.proficiency_level}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remarks */}
          {candidate.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{candidate.remarks}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
