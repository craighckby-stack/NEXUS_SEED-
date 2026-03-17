# Service Worker Directory

Progressive Web App (PWA) service worker files.

## Files

- `service-worker.js` - Main service worker

## Purpose

- Offline support
- Caching strategy
- Background sync
- Push notifications (future)

## Registration

Service worker registration is handled in `index.html`.

## Testing

To test service worker:
1. Open DevTools
2. Go to Application tab
3. Check Service Workers section
4. Verify caching behavior

## Updates

When deploying, update CACHE_NAME to bust cache.
