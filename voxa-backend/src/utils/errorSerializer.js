/**
 * 🛡️ OMNI-AUDIT FIX: [SEC-API-01]
 * Safely serializes error objects to prevent API key exfiltration.
 * Explicitly drops .config, .request, and .response which contain authorization headers.
 */
export const safeSerializeError = (err) => {
    if (!err) return 'Unknown Error';

    return {
        message: err.message || 'No message provided',
        name: err.name || 'Error',
        status: err.status || err?.response?.status || 'No status',
        code: err.code || err?.response?.data?.error?.code || 'No code',
    };
};