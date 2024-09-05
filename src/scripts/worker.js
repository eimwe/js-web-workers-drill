console.log("Worker script loaded");

const cache = new Map();

// Function to fetch data and cache the result
async function fetchAndCache(url) {
  console.log("Worker: fetchAndCache called with URL:", url);
  if (cache.has(url)) {
    console.log("Worker: Returning cached data for:", url);
    return cache.get(url);
  }

  try {
    console.log("Worker: Fetching data from:", url);
    const response = await fetch(url, {
      credentials: "include", // This ensures cookies are sent with the request
    });
    const data = await response.json();
    console.log("Worker: Data fetched successfully:", data);
    cache.set(url, data);
    return data;
  } catch (error) {
    console.error("Worker: Error fetching data:", error);
    throw error;
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async function (event) {
  console.log("Worker: Received message:", event.data);
  if (event.data.type === "fetch") {
    try {
      const data = await fetchAndCache(event.data.url);
      console.log("Worker: Sending fetched data back to main thread");
      self.postMessage(data);
    } catch (error) {
      console.error("Worker: Error processing fetch request:", error);
      self.postMessage({ error: error.message });
    }
  } else {
    console.warn("Worker: Received unknown message type:", event.data.type);
  }
});

console.log("Worker: Event listener set up");
