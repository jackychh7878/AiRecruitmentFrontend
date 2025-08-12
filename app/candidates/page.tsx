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
import { useToast } from "@/hooks/use-toast"
import { api, type CandidateProfile, type PaginationInfo } from "@/lib/api"
import { testBackendConnection, type ConnectionTestResult } from "@/lib/connection-test"
import { Plus, Search, MoreVertical, Eye, Edit, UserX, Trash2, ChevronLeft, ChevronRight, Loader2, AlertTriangle, CheckCircle, Wifi, UserCircle } from "lucide-react"
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
  const [deleteCandidate, setDeleteCandidate] = useState<CandidateProfile | null>(null)
  const [deactivateCandidate, setDeactivateCandidate] = useState<CandidateProfile | null>(null)
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult | null>(null)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const { toast } = useToast()

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
  }, [])

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
      await api.deleteCandidate(candidate.id)
      toast({
        title: "Success",
        description: `${candidate.first_name} ${candidate.last_name} has been deleted`,
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

  const filteredCandidates = candidates.filter(
    (candidate) =>
      `${candidate.first_name || ''} ${candidate.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (candidate.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (candidate.classification_of_interest || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
            placeholder="Search candidates by name, email, or classification..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
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
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {candidate.first_name?.[0] || 'U'}
                          {candidate.last_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {candidate.first_name || 'Unknown'} {candidate.last_name || 'User'}
                        </CardTitle>
                        <CardDescription>{candidate.email || 'No email provided'}</CardDescription>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/candidates/${candidate.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeactivateCandidate(candidate)} className="text-orange-600">
                          <UserX className="w-4 h-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteCandidate(candidate)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
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
                      {candidate.location && <Badge variant="outline">{candidate.location}</Badge>}
                    </div>

                    {candidate.ai_short_summary && (
                      <p className="text-sm text-gray-600 line-clamp-3">{candidate.ai_short_summary}</p>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{candidate.salary_expectation && `$${candidate.salary_expectation.toLocaleString()}`}</span>
                      <span>
                        {candidate.availability_weeks && `Available in ${candidate.availability_weeks} weeks`}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {deleteCandidate?.first_name} {deleteCandidate?.last_name}?
              This action cannot be undone and will remove all their data.
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
