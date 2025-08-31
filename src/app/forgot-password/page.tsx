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
  faKey,
  faExclamationTriangle,
  faCheck,
  faSpinner,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState(""); // email or phone

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+$/;
  const phoneRegex = /^\d{10,}$/;

  const getIdentifierType = (value: string) => {
    if (emailRegex.test(value)) return "email";
    if (phoneRegex.test(value)) return "phone";
    return "none";
  };

  const isIdentifierValid = (value = identifier) => getIdentifierType(value) !== "none";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!isIdentifierValid()) {
      setError("Please enter a valid email address or 10-digit phone number");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to process request");
      } else {
        // Generic positive message to avoid account enumeration
        setMessage(
          "If an account with that email or phone exists, a password reset link has been sent to the registered email address."
        );
        setIdentifier("");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md sm:max-w-lg md:max-w-xl bg-white rounded-2xl shadow-lg overflow-hidden border border-black/10">
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 bg-black text-white rounded-lg flex-shrink-0">
              <FontAwesomeIcon icon={faShieldAlt} className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-black leading-tight">Forgot Password</h1>
              <p className="text-black/60 text-xs sm:text-sm mt-1">Enter your email or phone to receive a reset link</p>
            </div>
          </div>

          <div className="w-full">
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

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-black flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={getIdentifierType(identifier) === "email" ? faEnvelope : faPhone}
                    className="text-black text-xs"
                  />
                  Email or Phone Number
                </Label>
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or phone number"
                  required
                  errorMessage={identifier && !isIdentifierValid(identifier) ? "Please enter a valid email or phone" : null}
                />
              </div>

              <div className="text-right">
                <Link
                  href="/signin"
                  className="text-black hover:underline font-medium text-xs flex items-center justify-end gap-1 hover:gap-2 transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faKey} className="text-xs" />
                  Back to Sign In
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading || !isIdentifierValid()}
                className="w-full bg-black hover:bg-black/90 text-white font-medium rounded-lg py-3 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faKey} className="text-sm" />
                    <span>Send Reset Link</span>
                  </div>
                )}
              </Button>

              <div className="pt-3 text-center">
                <p className="text-xs text-gray-500 leading-relaxed">
                  If the identifier exists, you&apos;ll receive an email with instructions to reset your password.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
