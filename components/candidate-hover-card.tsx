"use client"

import { useState, useEffect } from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { useConfig } from "@/components/config-provider"
import { type CandidateProfile } from "@/lib/api"
import {
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react"

interface CandidateHoverCardProps {
  candidateId: number
  children: React.ReactNode
  onViewFullProfile?: () => void
}

export function CandidateHoverCard({ candidateId, children, onViewFullProfile }: CandidateHoverCardProps) {
  const api = useApi()
  const { loading: configLoading } = useConfig()
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  const fetchCandidateProfile = async () => {
    if (hasLoaded || loading || configLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const profile = await api.getCandidate(candidateId, true)
      setCandidate(profile)
      setHasLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load candidate')
    } finally {
      setLoading(false)
    }
  }

  const openCandidateProfile = () => {
    if (candidate) {
      window.open(`/candidates/${candidate.id}`, '_blank')
    }
  }

  return (
    <HoverCard openDelay={500} closeDelay={200}>
      <HoverCardTrigger 
        asChild 
        onMouseEnter={fetchCandidateProfile}
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-96 p-0 shadow-lg border-0" 
        side="top"
        align="start"
      >
        <Card className="border-0 shadow-none">
          {loading && (
            <CardContent className="p-4">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Loading profile...</span>
              </div>
            </CardContent>
          )}

          {error && (
            <CardContent className="p-4">
              <div className="text-sm text-red-600">
                Failed to load profile
              </div>
            </CardContent>
          )}

          {candidate && !loading && (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="text-sm">
                        {candidate.first_name[0]}{candidate.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {candidate.first_name} {candidate.last_name}
                      </CardTitle>
                      <div className="flex flex-col gap-1 text-xs text-gray-600 mt-1">
                        {candidate.email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {candidate.email}
                          </div>
                        )}
                        {candidate.location && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {candidate.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onViewFullProfile}
                    title="View Full Profile"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-4">
                {/* Quick Info */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {candidate.salary_expectation && (
                    <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <DollarSign className="w-3 h-3 mr-1" />
                      HKD {candidate.salary_expectation.toLocaleString()}
                    </div>
                  )}
                  {candidate.availability_weeks && (
                    <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <Clock className="w-3 h-3 mr-1" />
                      Available in {candidate.availability_weeks} weeks
                    </div>
                  )}
                </div>

                {/* Tags */}
                {(candidate.classification_of_interest || candidate.sub_classification_of_interest) && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {candidate.classification_of_interest && (
                      <Badge variant="secondary" className="text-xs">
                        {candidate.classification_of_interest}
                      </Badge>
                    )}
                    {candidate.sub_classification_of_interest && (
                      <Badge variant="outline" className="text-xs">
                        {candidate.sub_classification_of_interest}
                      </Badge>
                    )}
                  </div>
                )}

                {/* AI Summary */}
                {candidate.ai_short_summary && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Sparkles className="w-3 h-3 mr-1 text-purple-600" />
                      <span className="text-xs font-medium text-gray-700">AI Summary</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                      {candidate.ai_short_summary}
                    </p>
                  </div>
                )}

                {/* View Full Profile Button */}
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={openCandidateProfile}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Full Profile
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </HoverCardContent>
    </HoverCard>
  )
} 