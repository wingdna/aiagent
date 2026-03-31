const MAX_RETRIES = 1;
let errorCount = 0;
let lastErrorTime = 0;
const RESET_TIME_MS = 10000; // 10 seconds
const MAX_ERRORS_IN_WINDOW = 3;

export const checkCircuitBreaker = () => {
  const now = Date.now();
  if (now - lastErrorTime > RESET_TIME_MS) {
    errorCount = 0;
  }
  return errorCount >= MAX_ERRORS_IN_WINDOW;
};

export const safeFetch = async (url: string, options: any = {}) => {
  const now = Date.now();
  
  // Reset error count if window passed
  if (now - lastErrorTime > RESET_TIME_MS) {
    errorCount = 0;
  }

  if (errorCount >= MAX_ERRORS_IN_WINDOW) {
     console.warn("[SYSTEM] Safety Circuit Breaker Active. Skipping request.");
     return { error: "Circuit Breaker Active", offline: true };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn("[SafeFetch] Network Offline. Skipping request.");
      return { error: "Network Offline", offline: true };
  }

  try {
    const res = await fetch(url, options);
    if (res.ok) { 
        errorCount = 0; 
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await res.json(); 
        } else {
            const text = await res.text();
            throw new Error(`Expected JSON, got ${contentType}: ${text.substring(0, 100)}`);
        }
    }
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP_${res.status}: ${errorText}`);
  } catch (err: any) {
    errorCount++;
    lastErrorTime = Date.now();
    // Only log full error if not a simple network failure
    if (err.name !== 'TypeError' || err.message !== 'Failed to fetch') {
        console.error(`[SafeFetch] Error: ${err.message}`);
    } else {
        console.warn(`[SafeFetch] Network/Fetch Error: ${err.message}`);
    }
    throw err;
  }
};
