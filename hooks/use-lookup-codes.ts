import { useState, useEffect } from "react"
import { api, type LookupCode, LOOKUP_CATEGORIES } from "@/lib/api"

// Cache for lookup codes to avoid repeated API calls
const lookupCache: Record<string, LookupCode[]> = {}

interface UseLookupCodesResult {
  codes: LookupCode[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useLookupCodes(category: string): UseLookupCodesResult {
  const [codes, setCodes] = useState<LookupCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCodes = async () => {
    // Check cache first
    if (lookupCache[category]) {
      setCodes(lookupCache[category])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await api.getLookupCodes(category)
      const activeCodes = response.codes.filter(code => code.is_active)
      
      // Cache the results
      lookupCache[category] = activeCodes
      setCodes(activeCodes)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch lookup codes"
      setError(errorMessage)
      console.error(`Failed to fetch lookup codes for category "${category}":`, err)
      
      // Set empty array on error
      setCodes([])
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    // Clear cache for this category
    delete lookupCache[category]
    await fetchCodes()
  }

  useEffect(() => {
    if (category) {
      fetchCodes()
    }
  }, [category])

  return { codes, loading, error, refetch }
}

// Convenience hooks for specific categories
export const useCitizenshipCodes = () => useLookupCodes(LOOKUP_CATEGORIES.CITIZENSHIP)
export const useClassificationCodes = () => useLookupCodes(LOOKUP_CATEGORIES.CLASSIFICATION_OF_INTEREST)
export const useSubClassificationCodes = () => useLookupCodes(LOOKUP_CATEGORIES.SUB_CLASSIFICATION_OF_INTEREST)
export const useLanguageCodes = () => useLookupCodes(LOOKUP_CATEGORIES.LANGUAGE)
export const useLanguageProficiencyCodes = () => useLookupCodes(LOOKUP_CATEGORIES.LANGUAGE_PROFICIENCY)
export const usePreferredWorkTypesCodes = () => useLookupCodes(LOOKUP_CATEGORIES.PREFERRED_WORK_TYPES) 