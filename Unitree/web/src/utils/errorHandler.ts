import { AxiosError } from 'axios';
import { useToast } from '../contexts/ToastContext';

// Error types for consistent handling
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

// Structured error response
export interface ErrorResponse {
  type: ErrorType;
  message: string;
  details?: string;
  statusCode?: number;
  originalError?: any;
}

// Define type for API error response data
interface ApiErrorResponse {
  message?: string;
  error?: string | Record<string, any>;
  details?: string;
  [key: string]: any; // Allow for any additional properties
}

/**
 * Handles API errors consistently throughout the application
 * @param error The error object from axios or other sources
 * @returns A standardized error response object
 */
export const handleApiError = (error: any): ErrorResponse => {
  // Default error response
  let errorResponse: ErrorResponse = {
    type: ErrorType.UNKNOWN,
    message: 'An unexpected error occurred',
  };
  
  // Handle Axios errors
  if (error.isAxiosError) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    // Set status code if available
    if (axiosError.response) {
      errorResponse.statusCode = axiosError.response.status;
    }
    
    // Determine error type based on status code
    if (axiosError.response?.status === 401) {
      errorResponse.type = ErrorType.AUTHENTICATION;
      errorResponse.message = 'Authentication failed. Please log in again.';
    } else if (axiosError.response?.status === 403) {
      errorResponse.type = ErrorType.AUTHORIZATION;
      errorResponse.message = 'You do not have permission to perform this action.';
    } else if (axiosError.response?.status === 404) {
      errorResponse.type = ErrorType.NOT_FOUND;
      errorResponse.message = 'The requested resource was not found.';
    } else if (axiosError.response?.status === 422 || axiosError.response?.status === 400) {
      errorResponse.type = ErrorType.VALIDATION;
      
      // Try to extract validation message from response
      const responseData = axiosError.response?.data;
      if (responseData) {
        if (responseData.message) {
          errorResponse.message = responseData.message;
        } else if (responseData.error) {
          errorResponse.message = typeof responseData.error === 'string' 
            ? responseData.error 
            : 'Validation failed. Please check your input.';
        }
      } else {
        errorResponse.message = 'Validation failed. Please check your input.';
      }
    } else if (axiosError.response && axiosError.response.status >= 500) {
      errorResponse.type = ErrorType.SERVER;
      errorResponse.message = 'Server error. Please try again later.';
    } else if (axiosError.code === 'ECONNABORTED') {
      errorResponse.type = ErrorType.NETWORK;
      errorResponse.message = 'The request timed out. Please try again.';
    } else if (!axiosError.response) {
      errorResponse.type = ErrorType.NETWORK;
      errorResponse.message = 'Network error. Please check your connection.';
    }
    
    // Include additional details if available
    const responseData = axiosError.response?.data;
    if (responseData && responseData.details) {
      errorResponse.details = responseData.details;
    }
    
    // Store original error for debugging
    errorResponse.originalError = axiosError;
  } else if (error instanceof Error) {
    // Handle standard JS errors
    errorResponse.message = error.message;
    errorResponse.details = error.stack;
    errorResponse.originalError = error;
  }
  
  return errorResponse;
};

/**
 * React hook for handling API errors
 * Shows appropriate toast messages based on error type
 */
export const useErrorHandler = () => {
  const { showToast } = useToast();
  
  const handleError = (error: any, customMessage?: string) => {
    const errorResponse = handleApiError(error);
    
    // Log all errors to console for debugging
    console.error('API Error:', errorResponse);
    
    // Show toast with appropriate message and style
    showToast(
      customMessage || errorResponse.message,
      errorResponse.type === ErrorType.NETWORK || 
      errorResponse.type === ErrorType.SERVER
        ? 'error'
        : 'warning'
    );
    
    return errorResponse;
  };
  
  return { handleError };
};

export default useErrorHandler; 