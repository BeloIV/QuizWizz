// Prefer an explicit environment variable (useful for docker / remote dev).
// If not set, default to a relative path '/api' so the dev server proxy can handle it.
const envUrl = (process.env && process.env.REACT_APP_API_BASE_URL) || '';

let API_BASE_URL = envUrl || '/api';

// If you're not using a dev proxy, set REACT_APP_API_BASE_URL to an absolute URL
// (e.g., http://localhost:8080/api or https://your-domain/api) before starting the dev server.

export { API_BASE_URL };