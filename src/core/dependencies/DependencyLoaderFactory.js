/**
 * DependencyLoaderFactory
 * This module provides a centralized function capable of resolving module paths or service names.
 * In a full DI implementation, this would encapsulate the logic of a dedicated DI container (e.g., Awilix, inversify).
 * 
 * For demonstration purposes, this factory defaults to synchronous require() but provides the required interface
 * needed by HandlerServiceResolver.
 */

// Note: This implementation assumes services are exported modules accessible via 'require'.
// Adjust path resolution logic as needed for environment (e.g., relative vs absolute paths, DI container lookup).
function defaultServiceLoader(serviceName) {
    try {
        // SECURITY WARNING: In a production environment dealing with user-defined input, 
        // ensure 'serviceName' is sanitized or mapped via an allowed list before calling require().
        // Assuming 'serviceName' here is a predefined module name from configuration.
        return require(serviceName);
    } catch (e) {
        console.error(`[DependencyLoader] Failed to load service: ${serviceName}`, e.message);
        return null; // Return null if not found/error, allowing HSR to handle the functional failure
    }
}

module.exports = defaultServiceLoader;
