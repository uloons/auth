"use client";

import React, { useState } from "react";
import LoadingOverlay from "@/components/loading-overlay";
import { useRouter } from 'next/navigation';
import { encryptEmail } from '@/lib/email-crypto';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBuilding,
  faEnvelope,
  faPhone,
  faIdCard,
  faArrowLeft,
  faCheck,
  faExclamationTriangle,
  faExclamationCircle,
  faSpinner,
  faStar,
  faUserTie,
  faHandshake,
  faShieldAlt
} from "@fortawesome/free-solid-svg-icons";

type Kind = "INDIVIDUAL" | "BUSINESS" | null;

export default function RegisterPage() {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailInvalidOpen, setEmailInvalidOpen] = useState(false);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      type Payload = {
        kind: "INDIVIDUAL" | "BUSINESS" | null;
        name?: string;
        businessName?: string;
        email?: string;
        phone?: string;
        gstin?: string;
      };
      const payload: Payload = { kind };
      if (kind === "INDIVIDUAL") {
        payload.name = name;
        payload.email = email;
        payload.phone = phone;
      } else {
        payload.name = businessName;
        payload.email = email;
        payload.phone = phone;
        if (gstin) payload.gstin = gstin;
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data?.error || "Unknown error";
        // phone in use
        if (data?.code === 'PHONE_IN_USE' || /phone/i.test(err)) {
          setError('This phone number is already in use.');
          setEmailInvalidOpen(false);
        } else if (data?.code === 'EMAIL_EXISTS' || /already exists/i.test(err)) {
          setError('An account with this email already exists.');
        } else {
          // If backend determined email domain is invalid, open dialog
          if (/mx|domain|email/i.test(err)) {
            setEmailInvalidOpen(true);
          }
          setError(err);
        }
      } else {
        // backend may return 200 with code EMAIL_UNVERIFIED
        if (data?.code === 'EMAIL_UNVERIFIED' || /password not set/i.test(data?.error || '')) {
          // open resend dialog
          setResendDialogOpen(true);
          setMessage(null);
          setError(null);
        } else {
  // redirect to confirmation page with encrypted token instead of raw email
          const emailForRedirect = payload.email || email;
          try {
            const token = await encryptEmail(emailForRedirect || '');
            router.push(`/register/sent?token=${encodeURIComponent(token)}`);
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            // fallback to original behavior if encryption fails
            router.push(`/register/sent?email=${encodeURIComponent(emailForRedirect)}`);
            setError(message);
          }
        }
  }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const resetKind = () => {
    setKind(null);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Full screen loading overlay */}
        <LoadingOverlay open={loading} title="Processing registration" description="We are verifying your email and sending a secure link to set your password. This may take a moment.">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-t-black border-gray-200" />
          <h3 className="text-lg font-bold">Processing registration</h3>
          <p className="text-sm text-gray-700 text-center">We are verifying your email and sending a secure link to set your password. This may take a moment.</p>
        </LoadingOverlay>
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-full mb-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <FontAwesomeIcon icon={faHandshake} className="text-xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-3 tracking-tight">
            Join Our Platform
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Choose your account type to get started with our premium services
          </p>
        </div>

        {/* Back Button - Only show when kind is selected */}
        {kind && (
          <div className="mb-8 animate-fade-in">
            <Button
              onClick={resetKind}
              variant="outline"
              className="inline-flex items-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-black border-2 border-black rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg group"
            >
              <FontAwesomeIcon 
                icon={faArrowLeft} 
                className="text-sm group-hover:-translate-x-1 transition-transform duration-300" 
              />
              Back to Selection
            </Button>
          </div>
        )}

        {/* Selection Cards */}
        <div
          className={`transition-all duration-700 ease-in-out transform ${
            kind 
              ? 'opacity-0 -translate-y-8 scale-95 pointer-events-none absolute' 
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Individual Card */}
            <div
              onClick={() => setKind('INDIVIDUAL')}
              className="group cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
            >
              <div className="relative bg-white border-3 border-black rounded-3xl p-6 md:p-8 h-full flex flex-col items-center text-center shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-black rounded-full"></div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-black rounded-full"></div>
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-black text-white rounded-full flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
                    <FontAwesomeIcon icon={faUser} className="text-2xl md:text-3xl" />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-black mb-3">Individual</h3>
                  <p className="text-gray-600 text-base mb-4 leading-relaxed">
                    Perfect for personal use and individual professionals
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FontAwesomeIcon icon={faStar} className="text-black text-xs" />
                      <span className="text-xs font-medium">Personal Account</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <FontAwesomeIcon icon={faShieldAlt} className="text-black text-xs" />
                      <span className="text-xs font-medium">Quick Setup</span>
                    </div>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-medium group-hover:bg-gray-800 transition-colors duration-300">
                    <span>Get Started</span>
                    <FontAwesomeIcon icon={faUser} className="text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Card */}
            <div
              onClick={() => setKind('BUSINESS')}
              className="group cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
            >
              <div className="relative bg-black text-white border-3 border-black rounded-3xl p-6 md:p-8 h-full flex flex-col items-center text-center shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-full"></div>
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white text-black rounded-full flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
                    <FontAwesomeIcon icon={faBuilding} className="text-2xl md:text-3xl" />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold mb-3">Business</h3>
                  <p className="text-gray-300 text-base mb-4 leading-relaxed">
                    Designed for companies, teams, and organizations
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <FontAwesomeIcon icon={faUserTie} className="text-white text-xs" />
                      <span className="text-xs font-medium">Team Management</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <FontAwesomeIcon icon={faShieldAlt} className="text-white text-xs" />
                      <span className="text-xs font-medium">Advanced Features</span>
                    </div>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-medium group-hover:bg-gray-100 transition-colors duration-300">
                    <span>Get Started</span>
                    <FontAwesomeIcon icon={faBuilding} className="text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email invalid dialog */}
        <AlertDialog open={emailInvalidOpen} onOpenChange={(open) => setEmailInvalidOpen(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Invalid Email</AlertDialogTitle>
              <AlertDialogDescription>
                The email address you entered appears invalid or the domain cannot receive emails. Please check your email and try again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 flex justify-end">
              <AlertDialogAction onClick={() => setEmailInvalidOpen(false)}>OK</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Resend dialog for previously registered-but-unverified email */}
        <AlertDialog open={resendDialogOpen} onOpenChange={(open) => setResendDialogOpen(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Email previously registered</AlertDialogTitle>
              <AlertDialogDescription>
                This email was registered previously but a password was not set. You can resend the secure set-password link to this email. If you don’t recognize this, ignore this message.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 flex justify-end gap-3">
              <AlertDialogAction onClick={() => setResendDialogOpen(false)}>Cancel</AlertDialogAction>
              <AlertDialogAction
                onClick={async () => {
                  setResendLoading(true);
                  setError(null);
                  try {
                    await fetch('/api/register/resend', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email }),
                    });
                    // always show ok message
                    setMessage('A fresh link to set your password has been sent if the email exists.');
                    setResendDialogOpen(false);
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : String(e);
                    setError(msg);
                  } finally {
                    setResendLoading(false);
                  }
                }}
              >
                {resendLoading ? 'Sending...' : 'Resend Email'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Form Section */}
        <div
          className={`transition-all duration-700 ease-in-out transform ${
            kind 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-95 pointer-events-none absolute'
          }`}
        >
          {kind && (
            <div className="bg-white border-2 border-black rounded-3xl p-6 md:p-8 shadow-2xl">
              {/* Form Header */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-gray-100">
                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
                  <FontAwesomeIcon 
                    icon={kind === 'INDIVIDUAL' ? faUser : faBuilding} 
                    className="text-lg" 
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                    Registering as
                  </div>
                  <div className="text-xl font-bold text-black">
                    {kind === 'INDIVIDUAL' ? 'Individual' : 'Business'}
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {error && (
                <Alert variant="destructive" className="mb-6 border-2 border-red-200 bg-red-50 animate-fade-in">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                  <AlertTitle className="font-bold">Error</AlertTitle>
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert className="mb-6 border-2 border-green-200 bg-green-50 text-green-800 animate-fade-in">
                  <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                  <AlertTitle className="font-bold text-green-800">Success</AlertTitle>
                  <AlertDescription className="text-green-700">{message}</AlertDescription>
                </Alert>
              )}

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  {kind === 'INDIVIDUAL' ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-black text-sm" />
                          Full Name
                        </Label>
                        <Input
                          validation="name"
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FontAwesomeIcon icon={faEnvelope} className="text-black text-sm" />
                          Email Address
                        </Label>
                        <Input
                          validation="email"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FontAwesomeIcon icon={faPhone} className="text-black text-sm" />
                          Phone Number
                        </Label>
                        <Input
                          validation="phone"
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FontAwesomeIcon icon={faBuilding} className="text-black text-sm" />
                          Business Name
                        </Label>
                        <Input
                          validation="name"
                          value={businessName} 
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Enter business name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FontAwesomeIcon icon={faEnvelope} className="text-black text-sm" />
                          Business Email
                        </Label>
                        <Input
                          validation="email"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          placeholder="Enter business email"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FontAwesomeIcon icon={faPhone} className="text-black text-sm" />
                          Business Phone
                        </Label>
                        <Input
                          validation="phone"
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter business phone"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FontAwesomeIcon icon={faIdCard} className="text-black text-sm" />
                          GSTIN <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                        </Label>
                        <Input 
                          value={gstin} 
                          onChange={(e) => setGstin(e.target.value)}
                          placeholder="Enter GSTIN number"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t-2 border-gray-100 space-y-4">
                  {/* Verification Notice */}
                  <Alert variant="warning" className="animate-fade-in">
                    <FontAwesomeIcon icon={faExclamationCircle} className="h-4 w-4" />
                    <AlertTitle className="font-bold text-yellow-800">Verification Notice</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      Please note that we are going to verify your Email and Phone number with our data Verification system.
                    </AlertDescription>
                  </Alert>

                  {/* Terms and Conditions Checkbox */}
                  <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl border-2 border-gray-100 animate-fade-in hover:bg-gray-100 transition-colors duration-200">
                    <Checkbox
                      id="terms"
                      variant="black"
                      size="sm"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                      I agree with all the{" "}
                      <span className="font-semibold text-black hover:underline cursor-pointer">
                        Terms and Conditions
                      </span>{" "}
                      and{" "}
                      <span className="font-semibold text-black hover:underline cursor-pointer">
                        Privacy Policy
                      </span>{" "}
                      of Uloons
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !agreeToTerms}
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white text-base font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:hover:bg-black"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        <span>Processing Registration...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Complete Registration</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}