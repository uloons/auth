"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelopeOpenText, faCheckCircle, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { decryptEmail } from '@/lib/email-crypto';
import LoadingOverlay from '@/components/loading-overlay';

export default function SentPage() {
  const [email, setEmail] = useState('');
  const [checked, setChecked] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const rawEmail = params.get('email');
        if (token) {
          // attempt to decrypt token
          (async () => {
            const decoded = await decryptEmail(token);
            if (decoded) setEmail(decoded);
            else setEmail('');
            setChecked(true);
          })();
        } else if (rawEmail) {
          // fallback for older links or if encryption failed during redirect
          setEmail(rawEmail);
          setChecked(true);
        } else {
          setEmail('');
          setChecked(true);
        }
      }
    } catch (e) {
      console.error('Error parsing email from URL', e);
      setChecked(true);
    }
  }, []);
  // If we've checked the URL and couldn't resolve an email, show the single error message as the whole content
  if (checked && !email) {
    return (
      <div className=" bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white dark:bg-black/90 border-2 border-gray-100 rounded-3xl p-10 md:p-14 shadow-2xl transform transition-all duration-700 hover:scale-101">
            <div className="text-center text-gray-600 text-lg">Something went wrong — invalid link</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white dark:bg-black/90 border-2 border-gray-100 rounded-3xl p-10 md:p-14 shadow-2xl transform transition-all duration-700">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-36 h-36 rounded-xl bg-black text-white flex items-center justify-center shadow-xl">
                <FontAwesomeIcon icon={faEnvelopeOpenText} className="text-3xl md:text-4xl" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-3">Check your inbox</h1>
              <p className="text-gray-600 text-lg mb-6">We sent a secure link to set your password. Click the link in the email to finish setting up your account.</p>

              <div className="mx-auto md:mx-0 inline-flex items-center gap-3 px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-600"
                  style={{ width: 32, height: 32 }}
                />
                <div className="text-left">
                  <div className="text-sm text-gray-500">Sent to</div>
                  <div className="font-medium text-black break-words">
                    {email ? (
                      email
                    ) : (
                      <span className="text-gray-400">Something went wrong — invalid link</span>
                    )}
                  </div>
                </div>
                
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Button asChild className="inline-flex items-center gap-3 bg-black text-white rounded-xl px-6 py-3 hover:bg-gray-800">
                  <Link href="/login" className="inline-flex items-center gap-3">
                    Go to Login
                    <FontAwesomeIcon icon={faArrowRight} />
                  </Link>
                </Button>

                <Button
                    variant="outline"
                    onClick={async () => {
                      setResendError(null);
                      setResendMessage(null);
                      setResendLoading(true);
                      try {
                        const res = await fetch('/api/register/resend', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setResendError(data?.error || 'Unable to resend email');
                        } else {
                          setResendMessage('A new password set link was sent if the email exists.');
                        }
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : String(e);
                        setResendError(msg);
                      } finally {
                        setResendLoading(false);
                      }
                    }}
                    className="inline-flex items-center gap-3 rounded-xl px-6 py-3"
                  >
                    Resend email
                  </Button>
              </div>
            </div>
          </div>

            {/* Resend feedback */}
            {resendError && (
              <div className="mt-6 text-sm text-red-600 text-center">{resendError}</div>
            )}

            {resendMessage && (
              <div className="mt-6 text-sm text-green-700 text-center">{resendMessage}</div>
            )}

            {/* Loading overlay for resend */}
            <LoadingOverlay open={resendLoading} title="Resending verification email" description="We are checking your account and sending a fresh secure link to set your password. This may take a moment.">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-black border-gray-200" />
              <h3 className="text-xl font-bold">Resending verification email</h3>
              <p className="text-sm text-gray-700 text-center">We are checking your account and sending a fresh secure link to set your password. This may take a moment.</p>
            </LoadingOverlay>

          <div className="mt-8 text-sm text-gray-500 text-center">
            If you do not see the email, check your spam folder or try resending. The link expires in 1 hour.
          </div>
        </div>
      </div>
    </div>
  );
}
