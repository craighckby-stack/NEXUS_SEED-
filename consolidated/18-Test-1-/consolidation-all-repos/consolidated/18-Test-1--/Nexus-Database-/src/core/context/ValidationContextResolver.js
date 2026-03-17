/**
 * GAX Constraint Validation Context Resolver
 * Maps execution context (e.g., request type, route) to a defined validation group.
 * Pre-processes configuration for optimized runtime lookups.
 */

import { RequestContext } from '@core/middleware/RequestContext.js';

export class ValidationContextResolver {
  /**
   * @param {object} config - Application configuration object.
   * @param {object} config.contextResolution.contextMap - The flat mapping of context keys to groups.
   */
  constructor(config) {
    this.httpRoutes = {};
    this.jobContexts = {};
    // Use safe access and immediately process config to optimize lookups.
    this.#processContextMap(config.contextResolution?.contextMap || {});
  }

  /**
   * Internal method to restructure the flat configuration map into optimized,
   * method-specific route arrays and job context map.
   * Inserts exact matches before glob matches in route arrays for correct priority lookup.
   * @param {object} contextMap
   */
  #processContextMap(contextMap) {
    for (const key in contextMap) {
      const group = contextMap[key];

      if (key.startsWith('HTTP:')) {
        // Expected format: HTTP:METHOD:PATH
        const parts = key.substring(5).split(':', 2);
        if (parts.length !== 2) continue;

        const method = parts[0].toUpperCase();
        const pathPattern = parts[1];
        const isGlob = pathPattern.endsWith('/*');

        if (!this.httpRoutes[method]) {
          this.httpRoutes[method] = [];
        }

        const routeEntry = { pattern: pathPattern, group, isGlob };

        // Prioritize exact matches (unshift) over glob matches (push).
        if (!isGlob) {
            this.httpRoutes[method].unshift(routeEntry);
        } else {
            this.httpRoutes[method].push(routeEntry);
        }

      } else if (key.startsWith('JOB_TYPE:')) {
        // Expected format: JOB_TYPE:NAME
        const jobType = key.substring(9);
        this.jobContexts[jobType] = group;
      }
    }
  }

  /**
   * Handles basic route pattern matching (only supports '/*' glob at the end).
   * @param {string} targetPath - The actual request route.
   * @param {string} pattern - The configured route pattern.
   * @returns {boolean}
   */
  #matchesPattern(targetPath, pattern) {
      if (pattern.endsWith('/*')) {
          return targetPath.startsWith(pattern.slice(0, -2));
      }
      return targetPath === pattern;
  }

  /**
   * Resolves the current context into a relevant validation group key.
   * @param {RequestContext} context - The current execution context object (HTTP, Job, etc.).
   * @returns {string} The resolved validation group name (e.g., 'creation_api', 'default').
   */
  resolveGroup(context) {
    if (context.isHttpRequest()) {
      const method = context.method.toUpperCase();
      const route = context.route; 
      
      const methodRoutes = this.httpRoutes[method];

      if (methodRoutes) {
        // Iterates through pre-filtered and prioritized list (exact matches first)
        for (const entry of methodRoutes) {
          if (this.#matchesPattern(route, entry.pattern)) {
            return entry.group;
          }
        }
      }
      
    } else if (context.isJobRequest()) {
       const jobType = context.jobType;
       // O(1) direct lookup for job type
       if (this.jobContexts[jobType]) {
         return this.jobContexts[jobType];
       }
    }

    return 'default';
  }
}
