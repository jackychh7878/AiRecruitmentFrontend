"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { api, type PromptTemplate, type PaginationInfo } from "@/lib/api"
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export default function PromptTemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [deleteTemplate, setDeleteTemplate] = useState<PromptTemplate | null>(null)
  const [activateTemplate, setActivateTemplate] = useState<PromptTemplate | null>(null)
  const [showBulkRegenDialog, setShowBulkRegenDialog] = useState(false)
  const [bulkRegenLoading, setBulkRegenLoading] = useState(false)
  const { toast } = useToast()

  const loadTemplates = async (page = 1, perPage = 10) => {
    try {
      setLoading(true)
      const activeOnly = activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined
      const response = await api.getPromptTemplates({
        page,
        per_page: perPage,
        active_only: activeOnly,
      })
      setTemplates(response.templates)
      setPagination(response.pagination)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load prompt templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [activeFilter])

  const handlePageChange = (newPage: number) => {
    loadTemplates(newPage, pagination.per_page)
  }

  const handlePerPageChange = (newPerPage: string) => {
    const perPage = Number.parseInt(newPerPage)
    loadTemplates(1, perPage)
  }

  const handleActivate = async (template: PromptTemplate) => {
    try {
      await api.activatePromptTemplate(template.id)
      toast({
        title: "Success",
        description: `Template "${template.name}" has been activated`,
      })
      loadTemplates(pagination.page, pagination.per_page)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate template",
        variant: "destructive",
      })
    }
    setActivateTemplate(null)
  }

  const handleDelete = async (template: PromptTemplate) => {
    try {
      await api.deletePromptTemplate(template.id)
      toast({
        title: "Success",
        description: `Template "${template.name}" has been deleted`,
      })
      loadTemplates(pagination.page, pagination.per_page)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
    setDeleteTemplate(null)
  }

  const handleBulkRegeneration = async () => {
    try {
      setBulkRegenLoading(true)
      
      // Start bulk regeneration job
      const response = await api.startBulkRegeneration(
        "admin@company.com", // This should come from user context
        activeTemplate?.id
      )

      if (response.success) {
      toast({
        title: "Bulk Regeneration Started",
          description: `Job ${response.job_id} started. AI summaries are being regenerated for all candidates.`,
        })

        // You could implement job monitoring here
        // monitorBulkRegenerationJob(response.job_id)
      } else {
        throw new Error(response.message || "Failed to start bulk regeneration")
      }

      setShowBulkRegenDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start bulk regeneration",
        variant: "destructive",
      })
    } finally {
      setBulkRegenLoading(false)
    }
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeTemplate = templates.find((t) => t.is_active)

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Prompt Template Management"
        description="Manage AI prompt templates for candidate profile summarization and embedding generation"
      >
        <div className="flex space-x-2">
          {activeTemplate && (
            <Button
              variant="outline"
              onClick={() => setShowBulkRegenDialog(true)}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Bulk Regenerate
            </Button>
          )}
          <Link href="/templates/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Active Template Banner */}
      {activeTemplate && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">Active Template</h3>
                <p className="text-sm text-green-700">
                  "{activeTemplate.name}" is currently being used for AI summary generation
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pagination.per_page.toString()} onValueChange={handlePerPageChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className={`hover:shadow-md transition-shadow ${template.is_active ? "ring-2 ring-green-500" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.is_active && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                        <Badge variant="outline">v{template.version_number}</Badge>
                      </div>
                      <CardDescription className="mb-3">
                        {template.description || "No description provided"}
                      </CardDescription>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Created by: {template.created_by}</div>
                        <div>Created: {new Date(template.created_date).toLocaleDateString()}</div>
                        <div>Modified: {new Date(template.last_modified_date).toLocaleDateString()}</div>
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
                          <Link href={`/templates/${template.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Template
                          </Link>
                        </DropdownMenuItem>
                        {!template.is_active && (
                          <DropdownMenuItem onClick={() => setActivateTemplate(template)} className="text-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteTemplate(template)}
                          className="text-red-600"
                          disabled={template.is_active}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono text-gray-700 max-h-32 overflow-y-auto">
                    {template.template_content.substring(0, 200)}
                    {template.template_content.length > 200 && "..."}
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
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} templates
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

      {/* Activate Template Confirmation Dialog */}
      <AlertDialog open={!!activateTemplate} onOpenChange={() => setActivateTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate "{activateTemplate?.name}"? This will deactivate the current active
              template and use this one for all future AI summary generations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => activateTemplate && handleActivate(activateTemplate)}
              className="bg-green-600 hover:bg-green-700"
            >
              Activate Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Template Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{deleteTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplate && handleDelete(deleteTemplate)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Regeneration Warning Dialog */}
      <AlertDialog open={showBulkRegenDialog} onOpenChange={setShowBulkRegenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              Bulk AI Regeneration Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                <strong>This is a heavy operation that will:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Regenerate AI summaries for ALL active candidate profiles</li>
                <li>Update embeddings for semantic search</li>
                <li>Use significant computational resources</li>
                <li>Take several minutes to complete</li>
              </ul>
              <p className="text-sm text-orange-600 font-medium">
                This operation cannot be undone. Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkRegenLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRegeneration}
              disabled={bulkRegenLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {bulkRegenLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Bulk Regeneration"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
