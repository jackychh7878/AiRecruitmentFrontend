// API configuration and utilities
// Note: These are fallback values. The actual values will be loaded from runtime config
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
let API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000

// Global API client instance that will be updated
let globalApiClient: ApiClient | null = null

// Function to update API configuration at runtime
export function updateApiConfig(baseUrl: string, timeout: number) {
  API_BASE_URL = baseUrl
  API_TIMEOUT = timeout
  
  // Create a new API client instance with updated configuration
  globalApiClient = new ApiClient(baseUrl, timeout)
  
  console.log('API configuration updated:', { baseUrl, timeout })
}

// Function to get current API configuration
export function getApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    timeout: API_TIMEOUT
  }
}

// Function to get the current API client instance
export function getApiClient(): ApiClient {
  if (!globalApiClient) {
    globalApiClient = new ApiClient(API_BASE_URL, API_TIMEOUT)
  }
  return globalApiClient
}

// Lookup code interfaces and constants
export interface LookupCode {
  id: number
  category: string
  com_code: string
  description: string
  is_active: boolean
  created_date: string
  last_modified_date: string
}

export interface LookupResponse {
  category: string
  codes: LookupCode[]
}

export const LOOKUP_CATEGORIES = {
  CLASSIFICATION_OF_INTEREST: "Classification of interest",
  LANGUAGE: "Language",
  LANGUAGE_PROFICIENCY: "Language proficiencey", // Note: keeping the typo as per API
  PREFERRED_WORK_TYPES: "Preferred work types",
  SUB_CLASSIFICATION_OF_INTEREST: "Sub classification of interest",
  CITIZENSHIP: "Your citizenship and visas"
} as const

// Utility functions for multi-select fields
export const convertStringToArray = (value?: string | null): string[] => {
  if (!value) return []
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0)
}

export const convertArrayToString = (values: string[]): string => {
  return values.filter(value => value.length > 0).join(', ')
}

export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
  error?: string
  candidate?: T  // For candidate-specific responses
  templates?: T[]  // For template responses
  pagination?: PaginationInfo  // For paginated responses
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
  citizenship?: string
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
  license_certification_name: string  // Matches backend database field name
  issuing_organisation: string        // Matches backend database field name
  issue_date: string
  expiry_date?: string               // Matches backend database field name
  is_no_expiry?: boolean
  description?: string
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
  file_name: string
  file_size: number
  content_type: string
  upload_date: string
  is_active: boolean
  created_date: string
  last_modified_date: string
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

// Chatbot interfaces
export interface ChatbotMessage {
  sessionId: string
  query: string
  attachment?: File
}

export interface ChatbotResponse {
  response: string
}

// API client class
class ApiClient {
  private baseURL: string
  private timeout: number

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  // Getter methods to access private properties
  get baseUrl(): string {
    return this.baseURL
  }

  get timeoutValue(): number {
    return this.timeout
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // Debug logging
    console.log('🌐 API Request:', {
      baseURL: this.baseURL,
      endpoint,
      fullURL: url,
      timestamp: new Date().toISOString()
    });

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    }

    try {
      const response = await fetch(url, config)
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        
        // Handle common connection errors
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to backend. Please check if the backend is running or switch to production API.')
        }
        
        if (error.message.includes('CORS')) {
          throw new Error('CORS error: Backend needs to allow requests from this origin.')
        }
        
        if (error.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error('Connection refused: Backend server is not running on the specified port.')
        }
        
        console.error("API request failed:", error)
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }

  // Candidate API methods
  async getCandidates(params?: {
    page?: number
    per_page?: number
    include_relationships?: boolean
    citizenship?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.per_page) searchParams.set("per_page", params.per_page.toString())
    if (params?.include_relationships) searchParams.set("include_relationships", "true")
    if (params?.citizenship) searchParams.set("citizenship", params.citizenship)

    const query = searchParams.toString()
    
    // Get the raw API response which has a flat structure
    const response = await this.request<{
      candidates: CandidateProfile[]
      total: number
      pages: number
      current_page: number
      per_page: number
    }>(`/candidates${query ? `?${query}` : ""}`)
    
    // Transform to the expected nested structure
    return {
      candidates: response.candidates,
      pagination: {
        page: response.current_page,
        per_page: response.per_page,
        total: response.total,
        pages: response.pages,
      }
    }
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
      query_embedding_dimension?: number
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

  // Prompt template methods - Fixed endpoints to match API documentation
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

    const response = await this.request<{
      success: boolean
      message: string
      candidate_data: Partial<CandidateProfile>
      parsing_stats: {
        file_size_bytes: number
        file_name: string
        entities_extracted: Record<string, number>
        contact_info_found: Record<string, boolean>
        name_extracted: Record<string, boolean>
        completeness_score: number
      }
    }>("/candidates/parse-resume", {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    })

    // Transform the response to match frontend expectations
    const transformedResponse = {
      success: response.success,
      message: response.message,
      parsed_data: {
        ...response.candidate_data,
        // Fix license certification field names
        licenses_certifications: response.candidate_data.licenses_certifications?.map(cert => ({
          ...cert,
          license_certification_name: (cert as any).name || cert.license_certification_name,
          issuing_organisation: (cert as any).issuing_organization || cert.issuing_organisation,
          expiry_date: (cert as any).expiration_date || cert.expiry_date,
          is_no_expiry: !!(cert as any).expiration_date === false || cert.is_no_expiry
        }))
      },
      confidence_score: response.parsing_stats.completeness_score / 100, // Convert percentage to decimal
      parsing_metadata: {
        processing_time: 0, // Not provided by API
        confidence_score: response.parsing_stats.completeness_score / 100
      }
    }
    
    return transformedResponse
  }

  async createFromParsedData(data: { parsed_data: Partial<CandidateProfile>; remarks?: string }) {
    // Transform the data to match the expected API format
    const transformedData = this.transformParsedDataForAPI(data.parsed_data)
    
    // Debug logging
    console.log("Original parsed data:", data.parsed_data)
    console.log("Transformed data for API:", transformedData)
    
    return this.request<ApiResponse<CandidateProfile>>("/candidates/create-from-parsed-data", {
      method: "POST",
      body: JSON.stringify(transformedData),
    })
  }

  private transformParsedDataForAPI(parsedData: Partial<CandidateProfile>) {
    const transformed: any = {
      // Basic candidate fields
      first_name: parsedData.first_name || "",
      last_name: parsedData.last_name || "",
      email: parsedData.email || "",
      location: parsedData.location || "",
      phone_number: parsedData.phone_number || "",
      personal_summary: parsedData.personal_summary || "",
      availability_weeks: parsedData.availability_weeks || 0,
      preferred_work_types: parsedData.preferred_work_types || "",
      right_to_work: parsedData.right_to_work || false,
      salary_expectation: parsedData.salary_expectation || 0,
      classification_of_interest: parsedData.classification_of_interest || "",
      sub_classification_of_interest: parsedData.sub_classification_of_interest || "",
      citizenship: parsedData.citizenship || "",
      is_active: true,
      
      // Transform career history
      career_history: (parsedData.career_history || []).map(job => ({
        job_title: job.job_title || "",
        company_name: job.company_name || "",
        start_date: this.formatDateForAPI(job.start_date),
        end_date: this.formatDateForAPI(job.end_date),
        description: job.description || "",
        is_active: true
      })),
      
      // Transform skills
      skills: (parsedData.skills || []).map(skill => ({
        skills: skill.skills || "",
        career_history_id: skill.career_history_id || null,
        is_active: true
      })),
      
      // Transform education
      education: (parsedData.education || []).map(edu => {
        // Fix cases where degree and school are swapped or malformed
        let school = edu.school || ""
        let degree = edu.degree || ""
        
        // If school is empty but degree looks like a university name, swap them
        if (!school && degree && (degree.toLowerCase().includes("university") || degree.toLowerCase().includes("college"))) {
          school = degree.trim()
          degree = "Degree" // Default placeholder
        }
        
        return {
          school: school,
          degree: degree,
          field_of_study: edu.field_of_study || "",
          start_date: this.formatDateForAPI(edu.start_date),
          end_date: this.formatDateForAPI(edu.end_date),
          grade: edu.grade || "",
          description: edu.description || "",
          is_active: true
        }
      }),
      
      // Transform licenses and certifications
      licenses_certifications: (parsedData.licenses_certifications || []).map(cert => ({
        name: cert.license_certification_name || (cert as any).name || "",
        issuing_organization: cert.issuing_organisation || (cert as any).issuing_organization || "",
        issue_date: this.formatDateForAPI(cert.issue_date),
        expiration_date: cert.is_no_expiry ? null : this.formatDateForAPI(cert.expiry_date || (cert as any).expiration_date),
        credential_id: (cert as any).credential_id || "",
        credential_url: (cert as any).credential_url || "",
        is_active: true
      })),
      
      // Transform languages
      languages: (parsedData.languages || []).map(lang => ({
        language: lang.language || "",
        proficiency_level: this.mapProficiencyLevel(lang.proficiency_level),
        is_active: true
      })),
      
      // Resumes (usually empty for new candidates)
      resumes: []
    }
    
    return transformed
  }

  private formatDateForAPI(dateString?: string | null): string | null {
    if (!dateString || dateString === "null" || dateString.trim() === "") {
      return null
    }
    
    // Handle malformed dates like "20" 
    if (dateString.length < 4) {
      return null
    }
    
    // Try to parse and format the date
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return null
      }
      return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
    } catch {
      return null
    }
  }

  private mapProficiencyLevel(level?: string): string {
    if (!level) return "BASIC"
    
    const upperLevel = level.toUpperCase()
    const validLevels = ["BASIC", "INTERMEDIATE", "ADVANCED", "FLUENT", "NATIVE"]
    
    // Direct match
    if (validLevels.includes(upperLevel)) {
      return upperLevel
    }
    
    // Fuzzy matching
    if (upperLevel.includes("FLUENT") || upperLevel.includes("NATIVE")) return "FLUENT"
    if (upperLevel.includes("ADVANCED") || upperLevel.includes("EXPERT")) return "ADVANCED"
    if (upperLevel.includes("INTERMEDIATE") || upperLevel.includes("MEDIUM")) return "INTERMEDIATE"
    
    return "BASIC" // Default fallback
  }

  // Resume upload
  async uploadResume(candidateId: number, file: File, remarks?: string) {
    const formData = new FormData()
    formData.append("pdf_file", file) // Backend expects 'pdf_file'
    formData.append("candidate_id", candidateId.toString()) // Backend expects 'candidate_id' as form field
    if (remarks) formData.append("remarks", remarks)

    return this.request<ApiResponse<Resume>>(`/resumes/upload`, {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    })
  }

  // Resume download
  async downloadResume(resumeId: number): Promise<Blob> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}/resumes/${resumeId}/download`, {
        method: "GET",
        headers: {
          Accept: "application/pdf,application/octet-stream",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      return response.blob()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Resume CRUD operations
  async getCandidateResumes(candidateId: number) {
    return this.request<{ candidate_id: number, resumes: Resume[], total: number }>(`/resumes/candidate/${candidateId}`)
  }

  async deleteResume(resumeId: number) {
    return this.request(`/resumes/${resumeId}`, {
      method: "DELETE",
    })
  }

  async hardDeleteResume(resumeId: number) {
    return this.request(`/resumes/${resumeId}/hard-delete`, {
      method: "DELETE",
    })
  }

  // Bulk regeneration methods
  async startBulkRegeneration(createdBy: string, promptTemplateId?: number) {
    return this.request<{
      success: boolean
      message: string
      job_id: string
      warnings?: string[]
    }>("/candidates/ai-summary/bulk-regenerate", {
      method: "POST",
      body: JSON.stringify({
        created_by: createdBy,
        prompt_template_id: promptTemplateId,
      }),
    })
  }

  async getBulkRegenerationJob(jobId: string) {
    return this.request<{
      job_id: string
      status: string
      started_at: string
      created_by: string
      prompt_template_id?: number
      total_profiles: number
      processed_profiles: number
      successful_updates: number
      failed_updates: number
      current_profile_id?: number
      estimated_completion?: string
      errors?: string[]
      completed_at?: string
    }>(`/candidates/ai-summary/bulk-regenerate/jobs/${jobId}`)
  }

  async getAllBulkRegenerationJobs() {
    return this.request<{
      jobs: Array<{
        job_id: string
        status: string
        started_at: string
        total_profiles: number
        processed_profiles: number
      }>
      total_jobs: number
    }>("/candidates/ai-summary/bulk-regenerate/jobs")
  }

  async cancelBulkRegenerationJob(jobId: string) {
    return this.request<ApiResponse>(`/candidates/ai-summary/bulk-regenerate/jobs/${jobId}`, {
      method: "DELETE",
    })
  }

  async getBulkRegenerationStats() {
    return this.request<{
      max_concurrent_workers: number
      rate_limit_delay_seconds: number
      active_jobs_count: number
      system_capacity: string
      estimated_processing_time_per_profile: string
    }>("/candidates/ai-summary/bulk-regenerate/stats")
  }

  // Lookup codes API
  async getLookupCodes(category: string) {
    return this.request<LookupResponse>(`/lookups/${encodeURIComponent(category)}`)
  }

  // Career History CRUD
  async getCareerHistory(candidateId: number) {
    return this.request<CareerHistory[]>(`/candidates/${candidateId}/career-history`)
  }

  async createCareerHistory(candidateId: number, data: Partial<CareerHistory>) {
    return this.request<CareerHistory>(`/candidates/${candidateId}/career-history`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateCareerHistory(candidateId: number, careerHistoryId: number, data: Partial<CareerHistory>) {
    return this.request<CareerHistory>(`/candidates/${candidateId}/career-history/${careerHistoryId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteCareerHistory(candidateId: number, careerHistoryId: number) {
    return this.request(`/candidates/${candidateId}/career-history/${careerHistoryId}`, {
      method: "DELETE",
    })
  }

  // Skills CRUD
  async getSkills(candidateId: number) {
    return this.request<{ candidate_id: number, skills: Skills[], total: number }>(`/skills/candidate/${candidateId}`)
  }

  async createSkill(candidateId: number, data: Partial<Skills>) {
    // Add candidate_id to the payload as required by backend
    const payload = {
      candidate_id: candidateId,
      career_history_id: data.career_history_id,
      skills: data.skills,
    }
    return this.request<Skills>(`/skills/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async updateSkill(candidateId: number, skillId: number, data: Partial<Skills>) {
    // Add candidate_id to the payload
    const payload = {
      candidate_id: candidateId,
      career_history_id: data.career_history_id,
      skills: data.skills,
      is_active: data.is_active,
    }
    return this.request<Skills>(`/skills/${skillId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  }

  async deleteSkill(candidateId: number, skillId: number) {
    return this.request(`/skills/${skillId}`, {
      method: "DELETE",
    })
  }

  // Education CRUD
  async getEducation(candidateId: number) {
    return this.request<{ candidate_id: number, education: Education[], total: number }>(`/education/candidate/${candidateId}`)
  }

  async createEducation(candidateId: number, data: Partial<Education>) {
    // Add candidate_id to the payload as required by backend
    const payload = {
      candidate_id: candidateId,
      school: data.school,
      degree: data.degree,
      field_of_study: data.field_of_study,
      start_date: data.start_date,
      end_date: data.end_date,
      grade: data.grade,
      description: data.description,
    }
    return this.request<Education>(`/education/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async updateEducation(candidateId: number, educationId: number, data: Partial<Education>) {
    // Add candidate_id to the payload
    const payload = {
      candidate_id: candidateId,
      school: data.school,
      degree: data.degree,
      field_of_study: data.field_of_study,
      start_date: data.start_date,
      end_date: data.end_date,
      grade: data.grade,
      description: data.description,
      is_active: data.is_active,
    }
    return this.request<Education>(`/education/${educationId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  }

  async deleteEducation(candidateId: number, educationId: number) {
    return this.request(`/education/${educationId}`, {
      method: "DELETE",
    })
  }

  // Licenses & Certifications CRUD
  async getLicensesCertifications(candidateId: number) {
    return this.request<{ licenses_certifications: LicenseCertification[], total: number }>(`/licenses_certifications/candidate/${candidateId}`)
  }

  async createLicenseCertification(candidateId: number, data: Partial<LicenseCertification>) {
    // Send data with field names that match the backend database model
    const payload = {
      candidate_id: candidateId,
      license_certification_name: data.license_certification_name,
      issuing_organisation: data.issuing_organisation,
      issue_date: data.issue_date,
      expiry_date: data.expiry_date,
      is_no_expiry: data.is_no_expiry,
      description: data.description,
    }
    return this.request<LicenseCertification>(`/licenses_certifications/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async updateLicenseCertification(candidateId: number, certificationId: number, data: Partial<LicenseCertification>) {
    // Send data with field names that match the backend database model
    const payload = {
      candidate_id: candidateId,
      license_certification_name: data.license_certification_name,
      issuing_organisation: data.issuing_organisation,
      issue_date: data.issue_date,
      expiry_date: data.expiry_date,
      is_no_expiry: data.is_no_expiry,
      description: data.description,
      is_active: data.is_active,
    }
    return this.request<LicenseCertification>(`/licenses_certifications/${certificationId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  }

  async deleteLicenseCertification(candidateId: number, certificationId: number) {
    return this.request(`/licenses_certifications/${certificationId}`, {
      method: "DELETE",
    })
  }

  // Languages CRUD
  async getLanguages(candidateId: number) {
    return this.request<{ candidate_id: number, languages: Language[], total: number }>(`/languages/candidate/${candidateId}`)
  }

  async createLanguage(candidateId: number, data: Partial<Language>) {
    // Add candidate_id to the payload as required by backend
    const payload = {
      candidate_id: candidateId,
      language: data.language,
      proficiency_level: data.proficiency_level,
    }
    return this.request<Language>(`/languages/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async updateLanguage(candidateId: number, languageId: number, data: Partial<Language>) {
    // Add candidate_id to the payload
    const payload = {
      candidate_id: candidateId,
      language: data.language,
      proficiency_level: data.proficiency_level,
      is_active: data.is_active,
    }
    return this.request<Language>(`/languages/${languageId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  }

  async deleteLanguage(candidateId: number, languageId: number) {
    return this.request(`/languages/${languageId}`, {
      method: "DELETE",
    })
  }

  // Chatbot webhook methods
  async sendChatbotMessage(message: ChatbotMessage): Promise<ChatbotResponse> {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    const authKey = process.env.NEXT_PUBLIC_N8N_AUTH_KEY
    const authValue = process.env.NEXT_PUBLIC_N8N_AUTH_VALUE

    if (!webhookUrl || !authKey || !authValue) {
      throw new Error('N8N webhook configuration is missing. Please check environment variables.')
    }

    // Validate PDF file if attachment is provided
    if (message.attachment) {
      if (message.attachment.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed as attachments.')
      }
    }

    try {
      let body: FormData | string
      let headers: Record<string, string> = {
        [authKey]: authValue,
      }

      if (message.attachment) {
        // Use FormData for file uploads
        const formData = new FormData()
        formData.append('sessionId', message.sessionId)
        formData.append('query', message.query)
        formData.append('attachment', message.attachment)
        body = formData
        // Don't set Content-Type header for FormData, let browser set it
        console.log('Sending FormData request:', {
          sessionId: message.sessionId,
          query: message.query,
          fileName: message.attachment.name,
          fileSize: message.attachment.size
        })
      } else {
        // Use JSON for text-only messages
        headers['Content-Type'] = 'application/json'
        const requestData = {
          sessionId: message.sessionId,
          query: message.query
        }
        body = JSON.stringify(requestData)
        console.log('Sending JSON request:', requestData)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = `Webhook request failed: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch {
          // If JSON parsing fails, use the default error message
        }
        throw new Error(errorMessage)
      }

      // Get response text first
      const responseText = await response.text()
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response received from webhook')
      }

      // Try to parse JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError)
        console.error('Response text:', responseText)
        throw new Error('Invalid JSON response from webhook. Expected format: {"response": "..."}')
      }

      // Validate response format
      if (!data || typeof data.response !== 'string') {
        console.error('Invalid response format:', data)
        throw new Error('Invalid response format. Expected: {"response": "..."}')
      }

      console.log('Webhook response received:', {
        originalText: responseText,
        parsedData: data,
        finalResponse: data.response
      })

      return {
        response: data.response
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Chatbot request timeout')
        }
        throw error
      }
      throw new Error('Unknown error occurred while sending message to chatbot')
    }
  }
}

// Export a proxy that always delegates to the current API client instance
export const api = new Proxy({} as ApiClient, {
  get(target, prop) {
    const currentClient = getApiClient()
    const value = (currentClient as any)[prop]
    return typeof value === 'function' ? value.bind(currentClient) : value
  }
})
