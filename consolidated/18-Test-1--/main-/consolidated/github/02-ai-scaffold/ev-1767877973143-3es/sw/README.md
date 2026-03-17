# Service Worker Directory

This directory contains the core files for enabling Progressive Web App (PWA) features, focusing heavily on performance and offline resilience.

## Primary File

| File Name | Description |
| :--- | :--- |
| `service-worker.js` | The main Service Worker script, handling installation, activation, and network requests. |

## Optimization Goals

The Service Worker is implemented with a focus on high-performance caching strategies:

*   **Offline Resilience:** Ensuring core application assets are immediately available via the cache.
*   **Intelligent Caching:** Utilizing strategies like **Cache-First** for static assets and **Stale-While-Revalidate** for dynamic content, maximizing speed while ensuring freshness.
*   **Background Tasks:** Supporting background sync functionality.
*   **Push Notifications (Future):** Infrastructure for handling push messaging.

## Lifecycle Management

Service Worker updates must be managed carefully to prevent serving stale content.

### Cache Busting

To ensure a new Service Worker installation (and thus a cache refresh), the defined `CACHE_NAME` constant within `service-worker.js` **must** be updated on deployment (e.g., `const CACHE_NAME = 'v1.0.1';`).

### Immediate Activation

For optimal user experience, `service-worker.js` is configured to bypass the waiting phase using `self.skipWaiting()` during installation, followed by `self.clients.claim()` during activation to immediately take control of open clients.

## Registration

The Service Worker is registered client-side, typically in `index.html` or the main application entry point script.

## Testing and Debugging

1.  **Open DevTools** (`F12`).
2.  Navigate to the **Application** tab.
3.  Under the **Service Workers** section:
    *   Verify the current status (Active and running).
    *   Utilize the **Update on reload** checkbox for simplified development iteration.
4.  Check **Cache Storage** to validate that assets are correctly versioned and stored according to the defined caching strategy.