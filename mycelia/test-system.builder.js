/**
 * Test System Builder for Ligneous
 *
 * Builds a test system with all facets for testing purposes.
 */

import { useBase } from 'mycelia-kernel-plugin';
import { useListeners } from 'mycelia-kernel-plugin';
import { useAuth } from './facets/auth.js';
import {
  useGedcomFiles,
  useGedcomIndividuals,
  useGedcomFamilies,
  useGedcomGraph,
  useGedcomDuplicates
} from './facets/gedcom/index.js';
import { useUserContent } from './facets/user-content.js';

/**
 * Build the test system with all facets
 * @param {string} [appName='ligneous-test'] - Name for the test system
 * @param {Object} [options] - Test options
 * @param {string} [options.apiUrl] - API URL for testing (default: http://localhost:4000/api)
 * @returns {Promise<StandalonePluginSystem>} Built system instance
 */
export const buildTestSystem = async (appName = 'ligneous-test', options = {}) => {
  const apiUrl = options.apiUrl || 'http://localhost:4000/api';

  return useBase(appName)
    .config('listeners', { registrationPolicy: 'multiple' })
    .config('api', {
      baseURL: apiUrl,
      timeout: 30000
    })
    .use(useListeners)
    .use(useAuth)
    .use(useGedcomFiles)
    .use(useGedcomIndividuals)
    .use(useGedcomFamilies)
    .use(useGedcomGraph)
    .use(useGedcomDuplicates)
    .use(useUserContent)
    .build();
};
