'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFacet, useListener } from 'mycelia-kernel-plugin/react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const auth = useFacet('auth');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Log component mount
  useEffect(() => {
    console.log('[RegisterPage] Component mounted', {
      hasAuthFacet: !!auth,
      initialAuthState: auth?.getState(),
    });
  }, [auth]);

  // Listen to registration success - redirect to login
  useListener('auth:registered', (event) => {
    console.log('[RegisterPage] Received auth:registered event, redirecting to /login', {
      userId: event.body.user?.id,
      username: event.body.user?.username,
      email: event.body.user?.email,
    });
    router.push('/login');
  });

  // Listen to auth state changes
  useListener('auth:stateChanged', (event) => {
    console.log('[RegisterPage] Received auth:stateChanged', {
      loading: event.body.loading,
      hasError: !!event.body.error,
      isAuthenticated: event.body.isAuthenticated,
    });
    if (event.body.loading !== undefined) {
      setLoading(event.body.loading);
    }
    if (event.body.error) {
      setError(event.body.error);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[RegisterPage] Form submitted', {
      username,
      email,
      hasPassword: !!password,
      hasName: !!name,
      passwordsMatch: password === confirmPassword,
    });
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      console.warn('[RegisterPage] Passwords do not match');
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    if (!auth) {
      console.error('[RegisterPage] Auth facet not available');
      setError('Authentication system not available');
      setLoading(false);
      return;
    }

    try {
      console.log('[RegisterPage] Calling auth.register()');
      await auth.register(username, email, password, name || null);
      console.log('[RegisterPage] auth.register() succeeded, waiting for redirect event');
      // No manual redirect - useListener('auth:registered') handles it
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      console.error('[RegisterPage] Registration failed', {
        username,
        email,
        error: errorMessage,
        status: err.response?.status,
      });
      setError(errorMessage);
      setLoading(false);
    }
  };

  const PasswordToggleButton = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-square"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-primary-content" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C10.89 2 10 2.89 10 4v2H8a2 2 0 00-2 2v2c0 1.11.89 2 2 2h2v8c0 1.11.89 2 2 2s2-.89 2-2v-8h2a2 2 0 002-2V8a2 2 0 00-2-2h-2V4c0-1.11-.89-2-2-2z"/>
            </svg>
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-base-content">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-base-content/60">
            Or <Link href="/login" className="link link-primary font-medium">sign in to your existing account</Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Username field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-base-content/70 mb-1">
                Username <span className="text-error">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                autoComplete="username"
                className="input"
                placeholder="Choose a username (min 3 characters)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-base-content/70 mb-1">
                Email <span className="text-error">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Name field (optional) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-base-content/70 mb-1">
                Display Name <span className="text-base-content/50">(optional)</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="input"
                placeholder="How should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-base-content/70 mb-1">
                Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input pr-12"
                  placeholder="Create a password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordToggleButton 
                  show={showPassword} 
                  onToggle={() => setShowPassword(!showPassword)} 
                />
              </div>
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-base-content/70 mb-1">
                Confirm Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={`input pr-12 ${
                    confirmPassword && password !== confirmPassword 
                      ? 'input-error' 
                      : ''
                  }`}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <PasswordToggleButton 
                  show={showConfirmPassword} 
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)} 
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-error">Passwords do not match</p>
              )}
            </div>
          </div>

          {/* Terms notice */}
          <p className="text-xs text-base-content/60 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="link link-primary">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="link link-primary">Privacy Policy</Link>
          </p>

          <div>
            <button
              type="submit"
              disabled={loading || (confirmPassword && password !== confirmPassword)}
              className="btn btn-primary w-full justify-center text-base py-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>

        {/* Back to home */}
        <div className="text-center">
          <Link 
            href="/" 
            className="link link-hover text-sm text-base-content/60"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
