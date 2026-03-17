/**
 * GAX Constraint Validation Context Resolver Kernel
 * Maps execution context (e.g., request type, route) to a defined validation group.
 * Configuration parsing and initialization are delegated and managed via Dependency Injection.
 */

import { RequestContext } from '@core/middleware/RequestContext.js';

/**
 * Interface for the stateful ContextResolutionMapper tool.
 * @interface IContextResolutionMapperToolKernel
 * @property {(args: { method?: string, route?: string, jobType?: string }) => string} execute - Resolves context attributes to a validation group.
 */

export class ValidationContextResolverKernel {
  /**
   * @type {IContextResolutionMapperToolKernel}
   */
  #mapper;

  /**
   * @param {IContextResolutionMapperToolKernel} mapperTool - The pre-initialized tool responsible for context mapping logic.
   */
  constructor(mapperTool) {
    this.#mapper = null; // Initialize private fields before setup
    this.#setupDependencies(mapperTool);
  }

  /**
   * Isolates dependency assignment and synchronous setup.
   * @param {IContextResolutionMapperToolKernel} mapperTool
   */
  #setupDependencies(mapperTool) {
    if (!mapperTool || typeof mapperTool.execute !== 'function') {
      throw new Error("IContextResolutionMapperToolKernel is required and must expose an 'execute' method.");
    }
    this.#mapper = mapperTool;
  }

  /**
   * Resolves the current context into a relevant validation group key.
   * @param {RequestContext} context - The current execution context object (HTTP, Job, etc.).
   * @returns {string} The resolved validation group name (e.g., 'creation_api', 'default').
   */
  resolveGroup(context) {
    const attributes = {};
    
    if (context.isHttpRequest()) {
      attributes.method = context.method;
      attributes.route = context.route; 
    } else if (context.isJobRequest()) {
      attributes.jobType = context.jobType;
    }

    // Delegate the resolution logic to the specialized tool
    return this.#mapper.execute(attributes);
  }
}