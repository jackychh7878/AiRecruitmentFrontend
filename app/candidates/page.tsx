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
import { useToast } from "@/hooks/use-toast"
import { api, type CandidateProfile, type PaginationInfo } from "@/lib/api"
import { Plus, Search, MoreVertical, Eye, Edit, UserX, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
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
  const { toast } = useToast()

  const loadCandidates = async (page = 1, perPage = 20) => {
    try {
      setLoading(true)
      const response = await api.getCandidates({
        page,
        per_page: perPage,
        include_relationships: true,
      })
      setCandidates(response.candidates)
      setPagination(response.pagination)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCandidates()
  }, [])

  const handlePageChange = (newPage: number) => {
    loadCandidates(newPage, pagination.per_page)
  }

  const handlePerPageChange = (newPerPage: string) => {
    const perPage = Number.parseInt(newPerPage)
    loadCandidates(1, perPage)
  }

  const handleDeactivate = async (candidate: CandidateProfile) => {
    try {
      await api.updateCandidate(candidate.id, { is_active: false })
      toast({
        title: "Success",
        description: `${candidate.first_name} ${candidate.last_name} has been deactivated`,
      })
      loadCandidates(pagination.page, pagination.per_page)
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
      loadCandidates(pagination.page, pagination.per_page)
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
      `${candidate.first_name} ${candidate.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.classification_of_interest?.toLowerCase().includes(searchQuery.toLowerCase()),
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search candidates by name, email, or classification..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={pagination.per_page.toString()} onValueChange={handlePerPageChange}>
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

      {/* Candidates Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {candidate.first_name[0]}
                          {candidate.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {candidate.first_name} {candidate.last_name}
                        </CardTitle>
                        <CardDescription>{candidate.email}</CardDescription>
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

          {/* Pagination */}
          {pagination.pages > 1 && (
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
