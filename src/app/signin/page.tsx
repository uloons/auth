"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPhone,
  faLock,
  faEye,
  faEyeSlash,
  faSignInAlt,
  faUserPlus,
  faKey,
  faExclamationTriangle,
  faCheck,
  faSpinner,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { getDeviceInfo } from "@/lib/device";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Form state
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

   // helpers for validation
   const isIdentifierValid = (value = identifier) => getIdentifierType(value) !== 'none';
   // Assume password must be at least 6 characters to be "valid"
   const isPasswordValid = (value = password) => value.trim().length >= 6;

  // Detect if identifier is email or phone
  const getIdentifierType = (value: string) => {
    const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/;
    const phoneRegex = /^\d{10,}$/;
    
    if (emailRegex.test(value)) return 'email';
    if (phoneRegex.test(value)) return 'phone';
    return 'none';
  };

  const validateIdentifier = (value: string) => {
    if (!value || value.trim().length === 0) {
      return "Email or phone number is required";
    }
    
    const type = getIdentifierType(value);
    if (type === 'none') {
      return "Please enter a valid email address or 10-digit phone number";
    }
    
    return "";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    // Validate identifier
    const identifierError = validateIdentifier(identifier);
    if (identifierError) {
      setError(identifierError);
      setLoading(false);
      return;
    }

    try {
      const deviceInfo = await getDeviceInfo();
      const payload = {
        identifier,
        password,
        type: getIdentifierType(identifier),
        deviceInfo,
      };

      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data?.message || data?.error || "Sign in failed");
      } else {
        // backend may respond with EMAIL_UNVERIFIED when email exists but not verified/password not set
        if (data?.code === 'EMAIL_UNVERIFIED') {
          setUnverifiedEmail(data?.email || (getIdentifierType(identifier) === 'email' ? identifier : null));
          setResendDialogOpen(true);
          setMessage(null);
          setError(null);
        } else {
          setMessage(data?.message || "Sign in successful! Redirecting...");
        }
        // Handle successful sign in (redirect, etc.)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    try {
      const res = await fetch('/api/register/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Unable to resend link');
      } else {
        setMessage('A fresh link has been sent to your email if it exists. Check your inbox.');
        setResendDialogOpen(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className=" bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md sm:max-w-lg md:max-w-xl bg-white rounded-2xl shadow-lg overflow-hidden border border-black/10">
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 bg-black text-white rounded-lg flex-shrink-0">
              <FontAwesomeIcon icon={faShieldAlt} className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-black leading-tight">Welcome Back</h1>
              <p className="text-black/60 text-xs sm:text-sm mt-1">Secure sign-in to access your account</p>
            </div>
          </div>

          <div className="w-full">

            {/* Alerts */}
            {error && (
              <Alert variant="destructive" className="mb-4 animate-fade-in">
                
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-black mt-1" />
                  <div>
                    <AlertTitle className="font-bold">Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </div>
        
              </Alert>
            )}

            {message && (
              <Alert variant="success" className="mb-4 animate-fade-in">
               
                  <FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-black mt-1" />
                  <div>
                    <AlertTitle className="font-bold">Success</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </div>
             
              </Alert>
            )}

            {/* Resend set-password link prompt for unverified emails */}
            {resendDialogOpen && (
              <div className="mb-4 p-4 rounded-lg border border-yellow-200 bg-yellow-50 animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm">Email not verified</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      We found an account for <span className="font-medium">{unverifiedEmail || 'this email'}</span> but a password hasn&apos;t been set.
                      Would you like us to resend the secure set-password link?
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setResendDialogOpen(false); setUnverifiedEmail(null); setError(null); }}
                      disabled={resendLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleResend} disabled={resendLoading} className="bg-black text-white">
                      {resendLoading ? (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faKey} className="text-sm" />
                          <span>Resend Link</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email or Phone Input */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-black flex items-center gap-2">
                  <FontAwesomeIcon 
                    icon={getIdentifierType(identifier) === 'email' ? faEnvelope : faPhone} 
                    className="text-black text-xs" 
                  />
                  Email or Phone Number
                </Label>
                <Input
                  validation="none"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or phone number"
                  required
                  errorMessage={identifier && !isIdentifierValid(identifier) ? validateIdentifier(identifier) : null}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-black flex items-center gap-2">
                  <FontAwesomeIcon icon={faLock} className="text-black text-xs" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    validation="none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors duration-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <FontAwesomeIcon 
                      icon={showPassword ? faEyeSlash : faEye} 
                      className="text-sm" 
                    />
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
        <div className="text-right">
                <Link 
                  href="/forgot-password" 
          className="text-black hover:underline font-medium text-xs flex items-center justify-end gap-1 hover:gap-2 transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faKey} className="text-xs" />
                  Forgot Password?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={loading || !isIdentifierValid() || !isPasswordValid()}
                className="w-full bg-black hover:bg-black/90 text-white font-medium rounded-lg py-3 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faSignInAlt} className="text-sm" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>

              {/* Register Link */}
              <div className="text-center pt-3 border-t border-gray-200">
                 <p className="text-black/70 mb-2 text-sm">Don&apos;t have an account?</p>
                <Link href="/register">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-black text-black hover:bg-black hover:text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
                      <span>Create Account</span>
                    </div>
                  </Button>
                </Link>
              </div>

              {/* Terms Notice */}
              <div className="pt-3 text-center">
                <p className="text-xs text-gray-500 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <Link href="/privacy-policy" className="text-black hover:underline font-medium">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms-of-use" className="text-black hover:underline font-medium">
                    Terms of Use
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}