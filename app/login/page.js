'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFacet, useListener } from 'mycelia-kernel-plugin/react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const auth = useFacet('auth');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Log component mount and verify listener setup
  useEffect(() => {
    console.log('[LoginPage] Component mounted', {
      hasAuthFacet: !!auth,
      initialAuthState: auth?.getState(),
    });
    
    // Verify listener registration (check after a short delay to allow useListener to register)
    const timeout = setTimeout(() => {
      if (auth) {
        const state = auth.getState();
        console.log('[LoginPage] Post-mount auth state check', {
          isAuthenticated: state.isAuthenticated,
          hasUser: !!state.user,
          loading: state.loading,
        });
      }
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [auth]);

  // Listen to login success event - redirect automatically
  useListener('auth:loggedIn', (event) => {
    console.log('[LoginPage] Received auth:loggedIn event, redirecting to /dashboard', {
      userId: event.body?.user?.id,
      username: event.body?.user?.username,
      eventType: event.type,
      eventBody: event.body,
      fullEvent: event,
    });
    router.push('/dashboard');
  }, [router]); // Include router in deps

  // Also check auth state after login as a fallback
  useEffect(() => {
    if (auth) {
      const state = auth.getState();
      if (state.isAuthenticated && state.user && !loading) {
        console.log('[LoginPage] Fallback: Detected authenticated state, redirecting', {
          userId: state.user.id,
          username: state.user.username,
        });
        router.push('/dashboard');
      }
    }
  }, [auth, loading, router]);

  // Listen to auth state changes for loading state
  useListener('auth:stateChanged', (event) => {
    console.log('[LoginPage] Received auth:stateChanged', {
      loading: event.body?.loading,
      hasError: !!event.body?.error,
      isAuthenticated: event.body?.isAuthenticated,
      eventType: event.type,
      eventBody: event.body,
    });
    if (event.body?.loading !== undefined) {
      setLoading(event.body.loading);
    }
    if (event.body?.error) {
      setError(event.body.error);
    }
  }, []); // Empty deps array - handler doesn't use external values

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[LoginPage] Form submitted', { username, hasPassword: !!password });
    setError('');
    setLoading(true);

    if (!auth) {
      console.error('[LoginPage] Auth facet not available');
      setError('Authentication system not available');
      setLoading(false);
      return;
    }

    try {
      console.log('[LoginPage] Calling auth.login()');
      const result = await auth.login(username, password);
      console.log('[LoginPage] auth.login() succeeded, waiting for redirect event', {
        result,
        currentState: auth.getState(),
      });
      
      // Fallback: Check state immediately after login (in case event doesn't fire)
      setTimeout(() => {
        const state = auth.getState();
        console.log('[LoginPage] Post-login state check (fallback)', {
          isAuthenticated: state.isAuthenticated,
          hasUser: !!state.user,
          loading: state.loading,
        });
        if (state.isAuthenticated && state.user && !loading) {
          console.log('[LoginPage] Fallback redirect triggered - event may not have fired');
          router.push('/dashboard');
        }
      }, 200);
      
      // No manual redirect - useListener('auth:loggedIn') handles it (if event fires)
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      console.error('[LoginPage] Login failed', {
        username,
        error: errorMessage,
        status: err.response?.status,
      });
      setError(errorMessage);
      setLoading(false);
    }
  };

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
            Sign in to Ligneous
          </h2>
          <p className="mt-2 text-center text-sm text-base-content/60">
            Or <Link href="/register" className="link link-primary font-medium">create a new account</Link>
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
                Username or Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="input"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Password field with toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-base-content/70 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="input pr-12"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-square"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    // Eye-off icon (password visible)
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    // Eye icon (password hidden)
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="link link-primary text-sm">
              Forgot your password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center text-base py-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Back to home */}
        <div className="text-center">
          <Link href="/" className="link link-hover text-sm text-base-content/60">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
