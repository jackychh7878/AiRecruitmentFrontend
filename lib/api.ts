// API configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginationInfo {
  page: number
  per_page: number
  total: number
  pages: number
}

export interface CandidateProfile {
  id: number
  first_name: string
  last_name: string
  email: string
  location?: string
  phone_number?: string
  personal_summary?: string
  availability_weeks?: number
  preferred_work_types?: string
  right_to_work?: boolean
  salary_expectation?: number
  classification_of_interest?: string
  sub_classification_of_interest?: string
  is_active: boolean
  remarks?: string
  ai_short_summary?: string
  created_date: string
  last_modified_date: string
  career_history?: CareerHistory[]
  skills?: Skills[]
  education?: Education[]
  licenses_certifications?: LicenseCertification[]
  languages?: Language[]
  resumes?: Resume[]
}

export interface CareerHistory {
  id: number
  candidate_id: number
  job_title: string
  company_name: string
  start_date: string
  end_date?: string
  description?: string
  is_active: boolean
  created_date: string
  last_modified_date: string
}

export interface Skills {
  id: number
  candidate_id: number
  career_history_id?: number
  skills: string
  is_active: boolean
  created_date: string
  last_modified_date: string
}

export interface Education {
  id: number
  candidate_id: number
  school: string
  degree: string
  field_of_study: string
  start_date: string
  end_date?: string
  grade?: string
  description?: string
  is_active: boolean
  created_date: string
  last_modified_date: string
}

export interface LicenseCertification {
  id: number
  candidate_id: number
  name: string
  issuing_organization: string
  issue_date: string
  expiration_date?: string
  credential_id?: string
  credential_url?: string
  is_active: boolean
  created_date: string
  last_modified_date: string
}

export interface Language {
  id: number
  candidate_id: number
  language: string
  proficiency_level: string
  is_active: boolean
  created_date: string
  last_modified_date: string
}

export interface Resume {
  id: number
  candidate_id: number
  filename: string
  file_path: string
  file_size: number
  upload_date: string
  is_active: boolean
}

export interface PromptTemplate {
  id: number
  name: string
  description?: string
  template_content: string
  is_active: boolean
  version_number: number
  created_by: string
  created_date: string
  last_modified_date: string
}

export interface SemanticSearchResult extends CandidateProfile {
  semantic_score: number
  keyword_score: number
  hybrid_score: number
  confidence_level: string
  relevance_percentage: number
  scoring_breakdown: {
    semantic_weight: number
    keyword_weight: number
    semantic_contribution: number
    keyword_contribution: number
  }
}

export interface SearchOptions {
  confidence_threshold?: number
  max_results?: number
  include_relationships?: boolean
}

// API client class
class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Candidate API methods
  async getCandidates(params?: {
    page?: number
    per_page?: number
    include_relationships?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.per_page) searchParams.set("per_page", params.per_page.toString())
    if (params?.include_relationships) searchParams.set("include_relationships", "true")

    const query = searchParams.toString()
    return this.request<{
      candidates: CandidateProfile[]
      pagination: PaginationInfo
    }>(`/candidates${query ? `?${query}` : ""}`)
  }

  async getCandidate(id: number, includeRelationships = false) {
    const params = includeRelationships ? "?include_relationships=true" : ""
    return this.request<CandidateProfile>(`/candidates/${id}${params}`)
  }

  async createCandidate(data: Partial<CandidateProfile>) {
    return this.request<ApiResponse<CandidateProfile>>("/candidates", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateCandidate(id: number, data: Partial<CandidateProfile>, generateAiSummary = false) {
    const params = generateAiSummary ? "?generate_ai_summary=true" : ""
    return this.request<ApiResponse<CandidateProfile>>(`/candidates/${id}${params}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteCandidate(id: number) {
    return this.request<ApiResponse>(`/candidates/${id}`, {
      method: "DELETE",
    })
  }

  // Semantic search methods
  async semanticSearch(query: string, options: SearchOptions = {}) {
    return this.request<{
      success: boolean
      results: SemanticSearchResult[]
      total_found: number
      query: string
      confidence_threshold: number
    }>("/candidates/semantic-search", {
      method: "POST",
      body: JSON.stringify({
        query,
        confidence_threshold: 0.7,
        max_results: 50,
        include_relationships: true,
        ...options,
      }),
    })
  }

  async getSemanticSearchStats() {
    return this.request<{
      total_active_candidates: number
      candidates_with_embeddings: number
      candidates_without_embeddings: number
      embedding_coverage_percentage: number
      default_confidence_threshold: number
      max_results_limit: number
      hybrid_scoring: {
        semantic_weight: number
        keyword_weight: number
        formula: string
        description: string
      }
    }>("/candidates/semantic-search/statistics")
  }

  async getSearchExamples() {
    return this.request<{
      examples: Array<{
        category: string
        queries: string[]
      }>
      tips: string[]
      confidence_thresholds: Record<string, string>
    }>("/candidates/semantic-search/example-queries")
  }

  // Prompt template methods
  async getPromptTemplates(params?: {
    page?: number
    per_page?: number
    active_only?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.per_page) searchParams.set("per_page", params.per_page.toString())
    if (params?.active_only !== undefined) searchParams.set("active_only", params.active_only.toString())

    const query = searchParams.toString()
    return this.request<{
      templates: PromptTemplate[]
      pagination: PaginationInfo
    }>(`/candidates/ai-summary/prompt-templates${query ? `?${query}` : ""}`)
  }

  async getActivePromptTemplate() {
    return this.request<PromptTemplate>("/candidates/ai-summary/prompt-template")
  }

  async createPromptTemplate(data: Partial<PromptTemplate>) {
    return this.request<ApiResponse<PromptTemplate>>("/candidates/ai-summary/prompt-templates", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updatePromptTemplate(id: number, data: Partial<PromptTemplate>) {
    return this.request<ApiResponse<PromptTemplate>>(`/candidates/ai-summary/prompt-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async activatePromptTemplate(id: number) {
    return this.request<ApiResponse>(`/candidates/ai-summary/prompt-templates/${id}/activate`, {
      method: "POST",
    })
  }

  async deletePromptTemplate(id: number) {
    return this.request<ApiResponse>(`/candidates/ai-summary/prompt-templates/${id}`, {
      method: "DELETE",
    })
  }

  // Resume parsing
  async parseResume(file: File) {
    const formData = new FormData()
    formData.append("resume_file", file)

    return this.request<{
      success: boolean
      parsed_data: Partial<CandidateProfile>
      confidence_score: number
    }>("/candidates/parse-resume", {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    })
  }

  async createFromParsedData(data: Partial<CandidateProfile>) {
    return this.request<ApiResponse<CandidateProfile>>("/candidates/create-from-parsed-data", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Resume upload
  async uploadResume(candidateId: number, file: File) {
    const formData = new FormData()
    formData.append("resume_file", file)

    return this.request<ApiResponse<Resume>>(`/candidates/${candidateId}/resumes`, {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    })
  }
}

export const api = new ApiClient()
