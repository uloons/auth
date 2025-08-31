import * as React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  validation?: 'name' | 'email' | 'phone' | 'password' | 'none'
  showError?: boolean
  errorMessage?: string | null
  /**
   * For password validation this controls the minimum length.
   */
  minLength?: number
  /**
   * Show a password visibility toggle when the input type is password.
   */
  showPasswordToggle?: boolean
}

function Input({ 
  className, 
  type, 
  validation = 'none',
  showError = true,
  errorMessage,
  minLength,
  value,
  onChange,
  ...props 
}: InputProps) {
  const [error, setError] = React.useState<string>("")
  const [touched, setTouched] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const reactId = React.useId()
  const inputId = (props.id as string) ?? `input-${reactId}`
  const errorId = `${inputId}-error`

  const handleValidation = React.useCallback((inputValue: string) => {
    if (!touched) return

    const validateName = (name: string): string => {
      if (!name || name.trim().length === 0) {
        return "Name is required"
      }
      if (!/[a-zA-Z]/.test(name)) {
        return "Invalid name - must contain at least one letter"
      }
      return ""
    }

    const validateEmail = (email: string): string => {
      if (!email || email.trim().length === 0) {
        return "Email is required"
      }
      const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/
      if (!emailRegex.test(email)) {
        return "Invalid email format"
      }
      return ""
    }

    const validatePhone = (phone: string): string => {
      if (!phone || phone.trim().length === 0) {
        return "Phone number is required"
      }
      if (phone.length < 10) {
        return "Phone number must be at least 10 digits"
      }
      return ""
    }

    const validatePassword = (pw: string): string => {
      const min = minLength ?? 8
      if (!pw || pw.trim().length === 0) {
        return `Password is required`
      }
      if (pw.length < min) {
        return `Password must be at least ${min} characters`
      }
      // require at least one uppercase, one digit, and one special character
      if (!/[A-Z]/.test(pw)) {
        return 'Password must contain at least one uppercase letter'
      }
      if (!/[0-9]/.test(pw)) {
        return 'Password must contain at least one number'
      }
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) {
        return 'Password must contain at least one special character'
      }
      return ""
    }

    let validationError = ""
    
    switch (validation) {
      case 'name':
        validationError = validateName(inputValue)
        break
      case 'email':
        validationError = validateEmail(inputValue)
        break
      case 'password':
        validationError = validatePassword(inputValue)
        break
      case 'phone':
        validationError = validatePhone(inputValue)
        break
      default:
        validationError = ""
    }

    setError(validationError)
  }, [touched, validation, minLength])

  React.useEffect(() => {
    if (value && touched) {
      handleValidation(String(value))
    }
  }, [value, touched, validation, handleValidation])

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true)
    handleValidation(e.target.value)
    props.onBlur?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (touched) {
      handleValidation(e.target.value)
    }
    onChange?.(e)
  }

  // Show an external error message immediately when provided.
  const hasExternalError = Boolean(errorMessage) && showError
  const hasError = (error && touched && showError) || hasExternalError
  const displayError = (errorMessage ?? undefined) || error

  return (
    <div className="w-full">
      <div className="relative">
        <input
          id={inputId}
          type={type === 'password' && showPassword ? 'text' : type}
          data-slot="input"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-12 w-full min-w-0 rounded-xl border-2 bg-transparent px-4 py-3 pr-12 text-base shadow-xs transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
            "focus:border-black focus:ring-0 focus:shadow-lg",
            hasError 
              ? "border-red-500 focus:border-red-500 bg-red-50" 
              : "border-gray-200 hover:border-gray-300",
            className
          )}
          {...props}
        />

        {type === 'password' && (props as { showPasswordToggle?: boolean }).showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:text-gray-900"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.065.164-2.094.47-3.066M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hasError && showError && (
        <div className="mt-2 flex items-center gap-2 text-red-500 text-sm font-medium animate-fade-in">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 512 512" 
            className="w-4 h-4 flex-shrink-0" 
            fill="currentColor"
          >
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM232 352a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>
          </svg>
          <span>{displayError}</span>
        </div>
      )}
    </div>
  )
}

export { Input }