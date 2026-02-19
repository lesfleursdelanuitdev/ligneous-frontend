'use client';

import { useMycelia } from 'mycelia-kernel-plugin/react';
import { useAuthState } from '@/hooks/useAuthState';
import Link from 'next/link';

export default function Home() {
  const system = useMycelia();
  const { user, isAuthenticated, authFacet } = useAuthState();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Ligneous
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Multi-tenant genealogy platform for GEDCOM file management.
          </p>
          <div className="mt-4 space-y-2">
            <div className="text-sm text-zinc-500">
              System: {system?.name || 'Loading...'}
            </div>
            {authFacet ? (
              <div className="text-sm">
                {isAuthenticated ? (
                  <div>
                    <span className="text-green-600">Logged in as: {user?.username}</span>
                    {' '}
                    <button
                      onClick={() => authFacet.logout()}
                      className="text-indigo-600 hover:text-indigo-500 underline"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div>
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-500 underline">
                      Login
                    </Link>
                    {' or '}
                    <Link href="/register" className="text-indigo-600 hover:text-indigo-500 underline">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-zinc-400">Auth facet not loaded</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
