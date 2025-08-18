import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a unique session ID for chatbot conversations
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Utility function to format chatbot response with proper line breaks
export function formatChatbotResponse(response: string): string {
  if (!response) return ''
  
  // Handle various line break formats
  return response
    .replace(/\\n/g, '\n')           // Convert \n to actual line breaks
    .replace(/\\r\\n/g, '\n')        // Convert \r\n to line breaks
    .replace(/\\r/g, '\n')           // Convert \r to line breaks
    .replace(/\r\n/g, '\n')          // Convert actual \r\n to \n
    .replace(/\r/g, '\n')            // Convert actual \r to \n
    .trim()                          // Remove leading/trailing whitespace
}
