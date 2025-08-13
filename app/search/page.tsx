"use client"

import { useState, useEffect, useMemo } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { api, type SemanticSearchResult, type SearchOptions } from "@/lib/api"
import { Search, Loader2, TrendingUp, Eye, Mail, MapPin, DollarSign, Sparkles, BarChart3, Info } from "lucide-react"
import Link from "next/link"
import { debounce } from "lodash"

type SearchMode = "broad" | "balanced" | "narrow"

interface SearchStats {
  total_active_candidates: number
  candidates_with_embeddings: number
  candidates_without_embeddings: number
  embedding_coverage_percentage: number
  default_confidence_threshold: number
  max_results_limit: number
}

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("")
  const [searchMode, setSearchMode] = useState<SearchMode>("balanced")
  const [maxResults, setMaxResults] = useState("20")
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null)
  const [totalFound, setTotalFound] = useState(0)
  const { toast } = useToast()

  const confidenceThresholds = {
    broad: 0.1,
    balanced: 0.2,
    narrow: 0.4,
  }

  const searchModeDescriptions = {
    broad: "Lower threshold (0.1) - More results, less precise matching",
    balanced: "Medium threshold (0.2) - Balanced results and precision",
    narrow: "Higher threshold (0.4) - Fewer results, more precise matching",
  }

  // Load search statistics on component mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.getSemanticSearchStats()
        setSearchStats(response)
      } catch (error) {
        console.error("Failed to load search statistics:", error)
        // Fallback to mock data for development
        setSearchStats({
          total_active_candidates: 0,
          candidates_with_embeddings: 0,
          candidates_without_embeddings: 0,
          embedding_coverage_percentage: 0,
          default_confidence_threshold: 0.7,
          max_results_limit: 50,
        })
      }
    }

    loadStats()
  }, [])

  const performSearch = async (searchQuery: string, options: SearchOptions = {}) => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const response = await api.semanticSearch(searchQuery.trim(), {
        confidence_threshold: confidenceThresholds[searchMode],
        max_results: Number.parseInt(maxResults),
        include_relationships: true,
        ...options,
      })

      if (response.success) {
        setResults(response.results)
        setTotalFound(response.total_found)
        setHasSearched(true)
      } else {
        throw new Error("Search failed")
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to perform semantic search. Please try again.",
        variant: "destructive",
      })
      setResults([])
      setTotalFound(0)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery: string) => {
        if (searchQuery.trim()) {
          performSearch(searchQuery)
        }
      }, 500),
    [searchMode, maxResults],
  )

  const handleSearch = () => {
    if (query.trim()) {
      performSearch(query)
    }
  }

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery)
    // Auto-search as user types (debounced)
    debouncedSearch(newQuery)
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "Very High":
        return "bg-green-100 text-green-800 border-green-200"
      case "High":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Good":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Moderate":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const exampleQueries = [
    "Python developer with machine learning experience",
    "Full-stack developer with React and Node.js",
    "Data scientist with 5+ years experience",
    "Senior software engineer with cloud experience",
    "Frontend developer with TypeScript skills",
    "DevOps engineer with Kubernetes experience",
  ]

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <PageHeader
        title="Semantic Search"
        description="Search candidates using natural language queries with AI-powered semantic matching"
      />

      {/* Search Interface */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Candidate Search
          </CardTitle>
          <CardDescription>
            Use natural language to find the most relevant candidates from your talent pool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search candidates by skills, experience, or requirements..."
              className="pl-12 pr-20 h-12 text-lg"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              size="sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {/* Search Options */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search Precision</label>
              <ToggleGroup
                type="single"
                value={searchMode}
                onValueChange={(value) => value && setSearchMode(value as SearchMode)}
                className="justify-start"
              >
                <ToggleGroupItem
                  value="broad"
                  className="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-800"
                >
                  Broad
                </ToggleGroupItem>
                <ToggleGroupItem value="balanced" className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800">
                  Balanced
                </ToggleGroupItem>
                <ToggleGroupItem value="narrow" className="data-[state=on]:bg-green-100 data-[state=on]:text-green-800">
                  Narrow
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-gray-500 mt-1">{searchModeDescriptions[searchMode]}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Max Results</label>
              <Select value={maxResults} onValueChange={setMaxResults}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 results</SelectItem>
                  <SelectItem value="20">20 results</SelectItem>
                  <SelectItem value="50">50 results</SelectItem>
                  <SelectItem value="100">100 results</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Example Queries */}
          {!hasSearched && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Example Searches:</h4>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(example)
                      performSearch(example)
                    }}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Statistics */}
      {searchStats && searchStats.total_active_candidates > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="w-5 h-5 mr-2" />
              Search Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{searchStats.total_active_candidates}</div>
                <div className="text-sm text-gray-600">Total Candidates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{searchStats.candidates_with_embeddings}</div>
                <div className="text-sm text-gray-600">AI-Enabled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(searchStats.embedding_coverage_percentage)}%
                </div>
                <div className="text-sm text-gray-600">Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{searchStats.default_confidence_threshold}</div>
                <div className="text-sm text-gray-600">Default Threshold</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>AI Coverage Progress</span>
                <span>
                  {searchStats.candidates_with_embeddings} / {searchStats.total_active_candidates}
                </span>
              </div>
              <Progress value={searchStats.embedding_coverage_percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold">Search Results</h2>
              {totalFound > 0 && (
                <Badge variant="secondary">
                  {totalFound} candidate{totalFound !== 1 ? "s" : ""} found
                </Badge>
              )}
            </div>
            {query && (
              <div className="text-sm text-gray-500">
                Query: "<span className="font-medium">{query}</span>"
              </div>
            )}
          </div>

          {/* Results List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="text-lg">
                            {candidate.first_name[0]}
                            {candidate.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <CardTitle className="text-lg">
                              {candidate.first_name} {candidate.last_name}
                            </CardTitle>
                            <Badge className={getConfidenceColor(candidate.confidence_level)}>
                              {candidate.confidence_level}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {candidate.email}
                            </span>
                            {candidate.location && (
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {candidate.location}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {Math.round(candidate.relevance_percentage)}%
                        </div>
                        <div className="text-xs text-gray-500">Relevance</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* AI Summary */}
                    {candidate.ai_short_summary && (
                      <div>
                        <div className="flex items-center mb-2">
                          <Sparkles className="w-4 h-4 text-purple-600 mr-1" />
                          <span className="text-sm font-medium text-gray-700">AI Summary</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{candidate.ai_short_summary}</p>
                      </div>
                    )}

                    {/* Professional Info */}
                    <div className="flex flex-wrap gap-2">
                      {candidate.classification_of_interest && (
                        <Badge variant="secondary">{candidate.classification_of_interest}</Badge>
                      )}
                      {candidate.sub_classification_of_interest && (
                        <Badge variant="outline">{candidate.sub_classification_of_interest}</Badge>
                      )}
                      {candidate.preferred_work_types &&
                        candidate.preferred_work_types.split(",").map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {type.trim()}
                          </Badge>
                        ))}
                    </div>

                    {/* Additional Info */}
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        {candidate.salary_expectation && (
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />${candidate.salary_expectation.toLocaleString()}
                          </span>
                        )}
                        {candidate.availability_weeks && <span>Available in {candidate.availability_weeks} weeks</span>}
                      </div>
                      <Link href={`/candidates/${candidate.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                      </Link>
                    </div>

                    <Separator />

                    {/* Scoring Breakdown */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Scoring Breakdown
                        </span>
                        <div className="text-xs text-gray-500">
                          Hybrid Score: {Math.round(candidate.hybrid_score * 100)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Semantic Match</span>
                            <span className="font-medium">{Math.round(candidate.semantic_score * 100)}%</span>
                          </div>
                          <Progress value={candidate.semantic_score * 100} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Keyword Match</span>
                            <span className="font-medium">{Math.round(candidate.keyword_score * 100)}%</span>
                          </div>
                          <Progress value={candidate.keyword_score * 100} className="h-1" />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Formula: {Math.round(candidate.scoring_breakdown.semantic_weight * 100)}% semantic +{" "}
                        {Math.round(candidate.scoring_breakdown.keyword_weight * 100)}% keyword
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search query or using broader search terms.</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>Tips for better results:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use specific skills and technologies</li>
                    <li>Include years of experience when relevant</li>
                    <li>Try broader search mode for more results</li>
                    <li>Use industry or domain knowledge terms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Help Section */}
      {!hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              How to Use Semantic Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Search Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use natural language descriptions</li>
                  <li>• Include specific skills and technologies</li>
                  <li>• Mention years of experience when relevant</li>
                  <li>• Add industry or domain context</li>
                  <li>• Try different search precision levels</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Search Modes</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • <strong>Broad:</strong> More results, less precise (0.1 threshold)
                  </li>
                  <li>
                    • <strong>Balanced:</strong> Good balance of results and precision (0.2 threshold)
                  </li>
                  <li>
                    • <strong>Narrow:</strong> Fewer results, more precise (0.4 threshold)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
