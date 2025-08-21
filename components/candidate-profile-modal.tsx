"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useApi } from "@/hooks/use-api"
import { useConfig } from "@/components/config-provider"
import { type CandidateProfile } from "@/lib/api"
import {
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Building,
  ExternalLink,
  Loader2,
  Briefcase,
  Clock,
  Sparkles,
} from "lucide-react"

interface CandidateProfileModalProps {
  candidateId: number | null
  isOpen: boolean
  onClose: () => void
}

export function CandidateProfileModal({ candidateId, isOpen, onClose }: CandidateProfileModalProps) {
  const api = useApi()
  const { loading: configLoading } = useConfig()
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (candidateId && isOpen && !configLoading) {
      fetchCandidateProfile(candidateId)
    }
  }, [candidateId, isOpen, configLoading])

  const fetchCandidateProfile = async (id: number) => {
    if (configLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const profile = await api.getCandidate(id, true) // include relationships
      setCandidate(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load candidate profile')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    })
  }

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''}`
    }
    
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`
    }
    
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
  }

  const openCandidateProfile = () => {
    if (candidate) {
      window.open(`/candidates/${candidate.id}`, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] w-[98vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Candidate Profile
            </span>
            {candidate && (
              <Button variant="outline" size="sm" onClick={openCandidateProfile}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Profile
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading candidate profile...
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {candidate && !loading && (
          <div className="space-y-8 p-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                                     <div className="flex items-center space-x-6">
                     <Avatar className="w-20 h-20">
                       <AvatarFallback className="text-2xl">
                         {candidate.first_name[0]}{candidate.last_name[0]}
                       </AvatarFallback>
                     </Avatar>
                    <div>
                      <CardTitle className="text-xl">
                        {candidate.first_name} {candidate.last_name}
                      </CardTitle>
                      {candidate.chinese_name && (
                        <div className="text-lg text-gray-600 font-medium mt-1">
                          {candidate.chinese_name}
                        </div>
                      )}
                                             <div className="flex flex-wrap gap-6 text-base text-gray-600 mt-3">
                        {candidate.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {candidate.email}
                          </div>
                        )}
                        {candidate.phone_number && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {candidate.phone_number}
                          </div>
                        )}
                        {candidate.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {candidate.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                                         {candidate.salary_expectation && (
                       <div className="flex items-center text-green-600 font-semibold text-lg">
                         <DollarSign className="w-5 h-5 mr-2" />
                         HKD {candidate.salary_expectation.toLocaleString()}
                       </div>
                     )}
                     {candidate.availability_weeks && (
                       <div className="flex items-center text-base text-gray-600 mt-2">
                         <Clock className="w-5 h-5 mr-2" />
                         Available in {candidate.availability_weeks} weeks
                       </div>
                     )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {candidate.personal_summary && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Personal Summary</h4>
                    <p className="text-gray-700">{candidate.personal_summary}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {candidate.classification_of_interest && (
                    <Badge variant="secondary">{candidate.classification_of_interest}</Badge>
                  )}
                  {candidate.sub_classification_of_interest && (
                    candidate.sub_classification_of_interest.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {tag.trim()}
                      </Badge>
                    ))
                  )}
                  {candidate.preferred_work_types && (
                    candidate.preferred_work_types.split(',').map((type, index) => (
                      <Badge key={`work-${index}`} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {type.trim()}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Summary */}
            {candidate.ai_short_summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{candidate.ai_short_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Career History */}
            {candidate.career_history && candidate.career_history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Career History
                  </CardTitle>
                </CardHeader>
                                 <CardContent>
                   <div className="space-y-6">
                    {candidate.career_history
                      .filter(job => job.is_active)
                      .sort((a, b) => {
                        // Sort by start date, most recent first
                        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
                      })
                      .map((job) => (
                                                 <div key={job.id} className="border-l-2 border-blue-200 pl-6 pb-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{job.job_title}</h4>
                              <div className="flex items-center text-gray-600 mt-1">
                                <Building className="w-4 h-4 mr-1" />
                                <span className="font-medium">{job.company_name}</span>
                              </div>
                                                             <div className="flex items-center text-sm text-gray-500 mt-1">
                                 <Calendar className="w-4 h-4 mr-1" />
                                 {formatDate(job.start_date)} - {formatDate(job.end_date || null)}
                                 <span className="mx-2">•</span>
                                 {calculateDuration(job.start_date, job.end_date || null)}
                               </div>
                            </div>
                            {!job.end_date && (
                              <Badge variant="default" className="ml-4">Current</Badge>
                            )}
                          </div>
                          {job.description && (
                            <p className="text-gray-700 mt-2 text-sm leading-relaxed">
                              {job.description}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            {candidate.remarks && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{candidate.remarks}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 