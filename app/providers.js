'use client';

/**
 * Providers Wrapper
 * 
 * Client component that provides:
 * - Theme context (light/dark mode)
 * - Mycelia system for state management
 */

import { useEffect } from 'react';
import { MyceliaProvider, useMycelia } from 'mycelia-kernel-plugin/react';
import { buildLigneousSystem } from '@/mycelia/system.builder.js';
import { ThemeProvider } from '@/components/shared/theme';

/**
 * Component that enables listeners after system is built
 */
function EnableListeners({ children }) {
  let system;
  try {
    system = useMycelia();
  } catch (error) {
    console.warn('[Providers] System not available yet:', error.message);
    return children; // Return children even if system isn't ready
  }

  useEffect(() => {
    console.log('[Providers] EnableListeners effect running', {
      hasSystem: !!system,
      hasListenersFacet: !!(system && system.listeners),
    });

    if (system && system.listeners) {
      const currentlyEnabled = system.listeners.hasListeners?.() || false;
      console.log('[Providers] Checking listeners status', {
        hasListenersFacet: !!system.listeners,
        listenersEnabled: currentlyEnabled,
        hasEnableMethod: typeof system.listeners.enableListeners === 'function',
      });
      
      if (!currentlyEnabled) {
        try {
          console.log('[Providers] Enabling listeners...');
          system.listeners.enableListeners({
            debug: true, // Enable debug logging for listeners
          });
          const nowEnabled = system.listeners.hasListeners?.() || false;
          console.log('[Providers] Listeners enable attempt completed', {
            listenersEnabled: nowEnabled,
            success: nowEnabled,
          });
        } catch (error) {
          console.error('[Providers] Error enabling listeners:', error);
        }
      } else {
        console.log('[Providers] Listeners already enabled');
      }
    } else {
      console.warn('[Providers] System or listeners facet not available', {
        hasSystem: !!system,
        hasListeners: !!(system && system.listeners),
      });
    }
  }, [system]);

  return children;
}

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query-client';
import { Toaster } from 'sonner';
import ErrorNotificationContainer from '@/components/shared/notifications/ErrorNotificationContainer';
import MyceliaQueryBridge from '@/components/shared/MyceliaQueryBridge';

export function Providers({ children }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider>
      <MyceliaProvider
        build={buildLigneousSystem}
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-base-100">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-content" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C10.89 2 10 2.89 10 4v2H8a2 2 0 00-2 2v2c0 1.11.89 2 2 2h2v8c0 1.11.89 2 2 2s2-.89 2-2v-8h2a2 2 0 002-2V8a2 2 0 00-2-2h-2V4c0-1.11-.89-2-2-2z"/>
                </svg>
              </div>
              <div className="text-lg font-medium text-base-content">
                Loading Ligneous...
              </div>
              <div className="text-sm text-base-content/60 mt-1">
                Preparing your genealogy workspace
              </div>
            </div>
          </div>
        }
      >
        <QueryClientProvider client={queryClient}>
          <EnableListeners>
            <MyceliaQueryBridge />
            {children}
            <ErrorNotificationContainer position="top-right" maxNotifications={5} />
            <Toaster position="bottom-right" richColors closeButton />
          </EnableListeners>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </MyceliaProvider>
    </ThemeProvider>
  );
}

