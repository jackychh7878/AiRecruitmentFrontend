"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { type CandidateProfile, type PaginationInfo } from "@/lib/api"
import { useCitizenshipCodes } from "@/hooks/use-lookup-codes"
import { testBackendConnection, type ConnectionTestResult } from "@/lib/connection-test"
import { Plus, Search, MoreVertical, Eye, Edit, UserX, Trash2, ChevronLeft, ChevronRight, Loader2, AlertTriangle, CheckCircle, Wifi, UserCircle,
UserCheck } from "lucide-react"
import Link from "next/link"

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [citizenshipFilter, setCitizenshipFilter] = useState<string>("")
  const [showDeactivated, setShowDeactivated] = useState(true)
  const [deleteCandidate, setDeleteCandidate] = useState<CandidateProfile | null>(null)
  const [deactivateCandidate, setDeactivateCandidate] = useState<CandidateProfile | null>(null)
  const [activateCandidate, setActivateCandidate] = useState<CandidateProfile | null>(null)
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult | null>(null)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const { toast } = useToast()
  const api = useApi() // Use the hook to get the current API client

  // Fetch citizenship codes dynamically
  const { codes: citizenshipCodes, loading: citizenshipLoading } = useCitizenshipCodes()

  // Test connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const result = await testBackendConnection()
      setConnectionTest(result)
      
      if (!result.isConnected) {
        setShowDebugPanel(true)
        toast({
          title: "Connection Error",
          description: result.error || "Cannot connect to backend",
          variant: "destructive",
        })
      }
    }
    
    checkConnection()
  }, [toast])

  const loadCandidates = async (page = 1, perPage = 20) => {
    try {
      setLoading(true)
      const response = await api.getCandidates({
        page,
        per_page: perPage,
        include_relationships: true,
        is_active: showDeactivated ? undefined : true,
        search: searchQuery || undefined,
        citizenship: citizenshipFilter || undefined,
      })
      
      // Ensure we have valid data before setting state
      if (response && response.candidates && response.pagination) {
        setCandidates(response.candidates)
        setPagination(response.pagination)
      } else {
        // Fallback to empty state if API response is malformed
        console.warn('Invalid API response structure:', response)
        setCandidates([])
        setPagination({
          page: page,
          per_page: perPage,
          total: 0,
          pages: 0,
        })
      }
      
      // Hide debug panel on successful load
      if (showDebugPanel) {
        setShowDebugPanel(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load candidates",
        variant: "destructive",
      })
      
      // Show debug panel on error
      setShowDebugPanel(true)
    } finally {
      setLoading(false)
    }
  }

  const retryConnection = async () => {
    const result = await testBackendConnection()
    setConnectionTest(result)
    
    if (result.isConnected) {
      toast({
        title: "Connection Restored",
        description: `Connected to ${result.endpoint}`,
      })
      loadCandidates()
    } else {
      toast({
        title: "Connection Failed",
        description: result.error || "Still cannot connect to backend",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadCandidates()
  }, [citizenshipFilter, showDeactivated])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== undefined) { // Only search when searchQuery is set (including empty string)
        loadCandidates(1, pagination?.per_page || 20) // Reset to page 1 when searching
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.pages && !loading) {
      setPagination(prev => ({ ...prev, page: newPage }))
      loadCandidates(newPage, pagination.per_page)
    }
  }

  const handlePerPageChange = (newPerPage: string) => {
    const perPage = Number.parseInt(newPerPage)
    if (perPage && !loading) {
      setPagination(prev => prev ? { ...prev, per_page: perPage, page: 1 } : { page: 1, per_page: perPage, total: 0, pages: 0 })
      loadCandidates(1, perPage)
    }
  }

  const handleDeactivate = async (candidate: CandidateProfile) => {
    try {
      await api.updateCandidate(candidate.id, { is_active: false })
      toast({
        title: "Success",
        description: `${candidate.first_name} ${candidate.last_name} has been deactivated`,
      })
      loadCandidates(pagination?.page || 1, pagination?.per_page || 20)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate candidate",
        variant: "destructive",
      })
    }
    setDeactivateCandidate(null)
  }

  const handleDelete = async (candidate: CandidateProfile) => {
    try {
      await api.hardDeleteCandidate(candidate.id)
      toast({
        title: "Success",
        description: `${candidate.first_name} ${candidate.last_name} has been permanently deleted`,
      })
      loadCandidates(pagination?.page || 1, pagination?.per_page || 20)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete candidate",
        variant: "destructive",
      })
    }
    setDeleteCandidate(null)
  }

  const handleActivate = async (candidate: CandidateProfile) => {
    try {
      await api.updateCandidate(candidate.id, { is_active: true })
      toast({
        title: "Success",
        description: `${candidate.first_name} ${candidate.last_name} has been reactivated`,
      })
      loadCandidates(pagination?.page || 1, pagination?.per_page || 20)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate candidate",
        variant: "destructive",
      })
    }
  }

  // Server-side filtering is now handled by the API, so we use candidates directly
  const filteredCandidates = candidates

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Candidate Management"
        description="Manage your talent pool with AI-powered profiles and semantic search capabilities"
      >
        <Link href="/candidates/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </Link>
      </PageHeader>

      {/* Debug Panel */}
      {showDebugPanel && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Connection Issue:</strong> {connectionTest?.error || "Cannot connect to backend"}
            <br />
            <span className="text-sm">Endpoint: {connectionTest?.endpoint}</span>
            <br />
            <Button
              variant="outline"
              size="sm"
              onClick={retryConnection}
              className="mt-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wifi className="w-4 h-4 mr-2" />}
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search candidates by name, email, classification, or sub-classification tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        <Select 
          value={citizenshipFilter || "all"} 
          onValueChange={(value) => setCitizenshipFilter(value === "all" ? "" : value)}
          disabled={loading || citizenshipLoading}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by citizenship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All citizenship types</SelectItem>
            {citizenshipCodes.map((code) => (
              <SelectItem key={code.id} value={code.com_code}>
                {code.com_code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-deactivated"
            checked={showDeactivated}
            onCheckedChange={setShowDeactivated}
            disabled={loading}
          />
          <Label htmlFor="show-deactivated" className="text-sm whitespace-nowrap">
            Show deactivated
          </Label>
        </div>
        <Select 
          value={pagination?.per_page?.toString() || "20"} 
          onValueChange={handlePerPageChange}
          disabled={loading}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Debug Info */}
      {process.env.NEXT_PUBLIC_DEBUG === 'true' && !loading && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>Debug Info:</strong>
            <br />
            <span className="text-sm">
              Total Candidates: {candidates.length} | 
              Filtered: {filteredCandidates.length} | 
              API Total: {pagination?.total || 0}
            </span>
            <br />
            <span className="text-xs">
              First candidate: {candidates[0] ? `${candidates[0].first_name} ${candidates[0].last_name}` : 'None'}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Candidates Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          {filteredCandidates.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <div className="text-gray-500 mb-4">
                                     <UserCircle className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No candidates found</h3>
                  <p className="text-sm">
                    {candidates.length === 0 
                      ? "No candidates are available. Add your first candidate to get started."
                      : "No candidates match your search criteria. Try adjusting your search query."
                    }
                  </p>
                </div>
                {candidates.length === 0 && (
                  <Link href="/candidates/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Candidate
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className={`hover:shadow-md transition-shadow ${!candidate.is_active ? 'opacity-60 bg-gray-50 border-gray-200' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className={!candidate.is_active ? 'opacity-60' : ''}>
                        <AvatarFallback>
                          {candidate.first_name?.[0] || 'U'}
                          {candidate.last_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className={`text-lg ${!candidate.is_active ? 'text-gray-500' : ''}`}>
                            {candidate.first_name || 'Unknown'} {candidate.last_name || 'User'}
                          </CardTitle>
                          {!candidate.is_active && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                              Deactivated
                            </Badge>
                          )}
                        </div>
                        {candidate.chinese_name && (
                          <div className={`text-sm ${!candidate.is_active ? 'text-gray-400' : 'text-gray-600'}`}>
                            {candidate.chinese_name}
                          </div>
                        )}
                        <CardDescription className={!candidate.is_active ? 'text-gray-400' : ''}>
                          {candidate.email || 'No email provided'}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/candidates/${candidate.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {candidate.is_active && (
                          <DropdownMenuItem asChild>
                            <Link href={`/candidates/${candidate.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Profile
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {candidate.is_active ? (
                          <DropdownMenuItem onClick={() => setDeactivateCandidate(candidate)} className="text-orange-600">
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setActivateCandidate(candidate)} className="text-green-600">
                            <UserCheck className="w-4 h-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setDeleteCandidate(candidate)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          {candidate.is_active ? 'Delete' : 'Permanently Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {candidate.classification_of_interest && (
                        <Badge variant="secondary">{candidate.classification_of_interest}</Badge>
                      )}
                      {candidate.sub_classification_of_interest && (
                        candidate.sub_classification_of_interest.split(',').slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {tag.trim()}
                          </Badge>
                        ))
                      )}
                      {candidate.sub_classification_of_interest && candidate.sub_classification_of_interest.split(',').length > 2 && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600">
                          +{candidate.sub_classification_of_interest.split(',').length - 2} more tags
                        </Badge>
                      )}
                      {candidate.citizenship && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {candidate.citizenship}
                        </Badge>
                      )}
                      {candidate.preferred_work_types && (
                        candidate.preferred_work_types.split(',').slice(0, 2).map((type, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {type.trim()}
                          </Badge>
                        ))
                      )}
                      {candidate.preferred_work_types && candidate.preferred_work_types.split(',').length > 2 && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600">
                          +{candidate.preferred_work_types.split(',').length - 2} more
                        </Badge>
                      )}
                    </div>

                    {candidate.ai_short_summary && (
                      <p className="text-sm text-gray-600 line-clamp-3">{candidate.ai_short_summary}</p>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{candidate.salary_expectation && `$${candidate.salary_expectation.toLocaleString()}`}</span>
                      <span>
                        {(candidate.availability_weeks && candidate.availability_weeks > 0) && `Available in ${candidate.availability_weeks} weeks`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.per_page + 1} to{" "}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} candidates
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={!!deactivateCandidate} onOpenChange={() => setDeactivateCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {deactivateCandidate?.first_name} {deactivateCandidate?.last_name}?
              This will hide them from active searches but preserve their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateCandidate && handleDeactivate(deactivateCandidate)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog open={!!activateCandidate} onOpenChange={() => setActivateCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate {activateCandidate?.first_name} {activateCandidate?.last_name}?
              This will make them visible in active searches again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => activateCandidate && handleActivate(activateCandidate)}
              className="bg-green-600 hover:bg-green-700"
            >
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {deleteCandidate?.first_name} {deleteCandidate?.last_name}?
              This action cannot be undone and will remove all their data from the system completely.
              {deleteCandidate?.is_active && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Note: This candidate is still active. Consider deactivating them first if you want to preserve their data.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCandidate && handleDelete(deleteCandidate)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
              </AlertDialog>
      </div>
    )
}
