const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiUrl = (path) => `${configuredApiUrl}${path}`;
