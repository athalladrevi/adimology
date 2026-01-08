let lastSyncedToken = null;

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // Look for the Authorization header
    const authHeader = details.requestHeaders.find(
      (header) => header.name.toLowerCase() === "authorization"
    );

    if (authHeader && authHeader.value) {
      // Check if it is a Bearer token
      if (authHeader.value.startsWith("Bearer ")) {
        const token = authHeader.value.substring(7); // Remove "Bearer " prefix

        // Only sync if the token has changed to avoid spamming the API
        if (token !== lastSyncedToken) {
            console.log("New token detected. Syncing...");
            syncToken(token);
        }
      }
    }
  },
  { urls: ["https://*.stockbit.com/*"] },
  ["requestHeaders"]
);

function syncToken(token) {
  const endpoint = `https://stockbite.netlify.app/api/update-token/${token}`;

  fetch(endpoint)
    .then((response) => {
      if (response.ok) {
        console.log("Token successfully synced to API.");
        lastSyncedToken = token; // Update cache on success
      } else {
        console.error("Failed to sync token. Status:", response.status);
      }
    })
    .catch((error) => {
      console.error("Error syncing token:", error);
    });
}
