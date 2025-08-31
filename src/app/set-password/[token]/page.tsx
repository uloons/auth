"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from '@/components/ui/alert-dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getDeviceInfo } from '@/lib/device';

export default function SetPasswordPage() {
  const params = useParams();
  const token = (params as { token?: string })?.token ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // verify token on mount
    let mounted = true;
    (async () => {
      try {
        setVerifying(true);
        const res = await fetch('/api/set-password/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          setValid(false);
          setError(data?.error || 'Invalid or expired token');
        } else {
          setValid(true);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setValid(false);
        setError(message);
      } finally {
        if (mounted) setVerifying(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // validate locally and show input-level errors
    const min = 8
    let ok = true
    if (password.length < min) {
      setPasswordError(`Password must be at least ${min} characters`)
      ok = false
    } else {
      setPasswordError(null)
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match')
      ok = false
    } else {
      setConfirmError(null)
    }
    if (!ok) return
    setLoading(true);
    try {
      // collect device details (best-effort) on the client and include in request
      let deviceInfo = null;
      try {
        deviceInfo = await getDeviceInfo();
      } catch {
        // ignore device collection failures
        deviceInfo = null;
      }

      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, deviceInfo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Unable to set password');
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faLock} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Set a password</h2>
              <p className="text-sm text-gray-600">Create a secure password for your account</p>
            </div>
          </div>

          {verifying && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 rounded-lg bg-black text-white flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
              </div>
              <h3 className="text-lg font-semibold">Verifying token...</h3>
              <p className="text-sm text-gray-500 mt-2">Please wait while we check your password reset link.</p>
            </div>
          )}

          {!verifying && valid === false && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <h3 className="text-xl font-bold text-red-700">Link expired or invalid</h3>
              <p className="text-sm text-gray-600 text-center max-w-xs">This password reset link is either expired or invalid. Request a new link from the registration page or click resend email.</p>
              <div className="mt-4">
                <Button className="bg-black text-white" onClick={() => { window.location.href = '/register'; }}>Go to register</Button>
              </div>
            </div>
          )}

          {!verifying && valid === true && (
            <>
              {error && (
                <div className="mb-4 text-red-700 bg-red-50 border border-red-200 p-3 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    // live-validate and clear server errors
                    // run simple checks here: length, uppercase, number, special
                    const v = e.target.value
                    if (v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v)) {
                      setPasswordError(null)
                    }
                  }}
                  onBlur={(e) => {
                    const v = e.target.value
                    if (v.length < 8) setPasswordError('Password must be at least 8 characters')
                    else if (!/[A-Z]/.test(v)) setPasswordError('Password must contain at least one uppercase letter')
                    else if (!/[0-9]/.test(v)) setPasswordError('Password must contain at least one number')
                    else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v)) setPasswordError('Password must contain at least one special character')
                    else setPasswordError(null)
                  }}
                  placeholder="Password (min 8 chars)"
                  required
                  validation="password"
                  minLength={8}
                  errorMessage={passwordError}
                  showPasswordToggle={true}
                />

                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    if (password === e.target.value) setConfirmError(null)
                  }}
                  onBlur={(e) => {
                    if (password !== e.target.value) setConfirmError('Passwords do not match')
                  }}
                  placeholder="Confirm password"
                  required
                  errorMessage={confirmError}
                />

                <Button type="submit" className="w-full h-12 bg-black text-white" disabled={loading}>
                  {loading ? <span className="flex items-center gap-2"><FontAwesomeIcon icon={faSpinner} className="animate-spin"/> Setting...</span> : <span className="flex items-center gap-2"><FontAwesomeIcon icon={faCheck} /> Set Password</span>}
                </Button>
              </form>
            </>
          )}

          {success && (
            <AlertDialog open={true} onOpenChange={() => {}}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Password set</AlertDialogTitle>
                  <AlertDialogDescription>Your password has been set. You can now login.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="mt-4 flex justify-end gap-2">
                  <AlertDialogAction onClick={() => { window.location.href = '/'; }}>OK</AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          )}

        </div>
      </div>
    </div>
  );
}
