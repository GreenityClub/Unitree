export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class Validator {
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  }

  static validateUniversityEmail(email: string): ValidationResult {
    const basicValidation = this.validateEmail(email);
    if (!basicValidation.isValid) {
      return basicValidation;
    }
    
    if (!email.includes('.edu') && !email.includes('.ac.')) {
      return { isValid: false, error: 'Please use your university email address' };
    }
    
    return { isValid: true };
  }

  static validatePassword(password: string, confirmPassword?: string): ValidationResult {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    
    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters long' };
    }
    
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { isValid: false, error: 'Passwords do not match' };
    }
    
    return { isValid: true };
  }

  static validateRequired(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, error: `${fieldName} is required` };
    }
    
    return { isValid: true };
  }

  static validateName(name: string, fieldName: string): ValidationResult {
    const requiredValidation = this.validateRequired(name, fieldName);
    if (!requiredValidation.isValid) {
      return requiredValidation;
    }
    
    if (name.length < 2) {
      return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
    }
    
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name)) {
      return { isValid: false, error: `${fieldName} can only contain letters, spaces, apostrophes, and hyphens` };
    }
    
    return { isValid: true };
  }

  static validateStudentId(studentId: string): ValidationResult {
    if (!studentId) {
      return { isValid: true }; // Student ID is optional
    }
    
    if (studentId.length < 3) {
      return { isValid: false, error: 'Student ID must be at least 3 characters long' };
    }
    
    return { isValid: true };
  }

  static validateField(value: string, rules: ValidationRule): ValidationResult {
    if (rules.required && (!value || value.trim() === '')) {
      return { isValid: false, error: rules.message || 'This field is required' };
    }
    
    if (value && rules.minLength && value.length < rules.minLength) {
      return { isValid: false, error: rules.message || `Must be at least ${rules.minLength} characters long` };
    }
    
    if (value && rules.maxLength && value.length > rules.maxLength) {
      return { isValid: false, error: rules.message || `Must be no more than ${rules.maxLength} characters long` };
    }
    
    if (value && rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, error: rules.message || 'Invalid format' };
    }
    
    if (value && rules.custom && !rules.custom(value)) {
      return { isValid: false, error: rules.message || 'Invalid value' };
    }
    
    return { isValid: true };
  }
} 