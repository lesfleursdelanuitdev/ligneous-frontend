/**
 * Mycelia System Builder
 * 
 * Configures and builds the Mycelia Plugin System with all required facets
 * for the Ligneous frontend application.
 */

/* eslint-disable react-hooks/rules-of-hooks */
// useBase and use* functions are Mycelia kernel functions, not React hooks

import { useBase, useListeners } from 'mycelia-kernel-plugin';
import { useAuth } from './facets/auth.js';
import {
  useGedcomFiles,
  useGedcomIndividuals,
  useGedcomFamilies,
  useGedcomGraph,
  useGedcomDuplicates,
  useFamilyTreeVisualizer
} from './facets/gedcom/index.js';
import { useAlbums } from './facets/albums.js';
import { useTags } from './facets/tags.js';
import { useErrors } from './facets/errors.js';
import { useUserContent } from './facets/user-content.js';
import { useComments } from './facets/comments.js';
import { config } from '../config/index.js';

/**
 * Build the Ligneous system with all required hooks
 * @returns {Promise<StandalonePluginSystem>} Built system instance
 */
export const buildLigneousSystem = async () => {
  // Get client-side configuration (handles browser vs server)
  const clientConfig = config.getClientConfig();
  const apiConfig = clientConfig.api;

  console.log('[SystemBuilder] Building Ligneous system');
  
  // useBase is a Mycelia kernel function, not a React hook
  return useBase('ligneous-frontend')
    .config('listeners', { registrationPolicy: 'multiple', debug: true })
    .config('api', {
      baseURL: apiConfig.nextApi.baseURL,
      timeout: apiConfig.nextApi.timeout
    })
    .config('goAPI', {
      baseURL: apiConfig.goApi.baseURL,
      timeout: apiConfig.goApi.timeout
    })
    .use(useListeners)
    .use(useErrors)  // Errors facet should be early to collect errors from other facets
    .use(useAuth)
    .use(useGedcomFiles)
    .use(useGedcomIndividuals)
    .use(useGedcomFamilies)
    .use(useGedcomGraph)
    .use(useGedcomDuplicates)
    .use(useFamilyTreeVisualizer)
    .use(useAlbums)
    .use(useTags)
    .use(useUserContent)
    .use(useComments)
    .onInit(async (api, ctx) => {
      // Enable listeners automatically after system is built
      console.log('[SystemBuilder] System initialized, enabling listeners', {
        systemName: api.name,
        hasFacets: !!api.__facets,
      });
      
      // Access listeners facet via api.__facets.find()
      const listenersFacet = api.__facets.find('listeners');
      if (listenersFacet) {
        const currentlyEnabled = listenersFacet.hasListeners?.() || false;
        console.log('[SystemBuilder] Listeners status before enable', {
          hasListenersFacet: !!listenersFacet,
          listenersEnabled: currentlyEnabled,
          hasEnableMethod: typeof listenersFacet.enableListeners === 'function',
        });
        
        if (!currentlyEnabled) {
          try {
            listenersFacet.enableListeners({
              debug: true,
            });
            const nowEnabled = listenersFacet.hasListeners?.() || false;
            console.log('[SystemBuilder] Listeners enabled successfully', {
              success: nowEnabled,
              listenersEnabled: nowEnabled,
            });
          } catch (error) {
            console.error('[SystemBuilder] Error enabling listeners:', error);
          }
        } else {
          console.log('[SystemBuilder] Listeners already enabled');
        }
      } else {
        console.warn('[SystemBuilder] Listeners facet not found via api.__facets.find("listeners")');
      }
      
      // Initialize errors facet (setup error listeners)
      const errorsFacet = api.__facets.find('errors');
      if (errorsFacet && typeof errorsFacet.initialize === 'function') {
        console.log('[SystemBuilder] Initializing errors facet');
        try {
          errorsFacet.initialize();
        } catch (error) {
          console.error('[SystemBuilder] Error initializing errors facet:', error);
        }
      } else {
        console.warn('[SystemBuilder] Errors facet not found or missing initialize method');
      }
    })
    .build();
};

