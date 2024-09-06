console.log("Worker script loaded");

let dbPromise;

// Function to initialize the database
function initDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const dbName = "WorkerCache";
      const request = indexedDB.open(dbName, 1);

      request.onerror = function (event) {
        console.error("Error opening database:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = function (event) {
        console.log("Database opened successfully");
        resolve(event.target.result);
      };

      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        db.createObjectStore("cache", { keyPath: "url" });
        console.log("Object store created");
      };
    });
  }
  return dbPromise;
}

// Function to fetch data and cache the result in IndexedDB
async function fetchAndCache(url) {
  console.log("Worker: fetchAndCache called with URL:", url);

  // Ensure database is initialized
  const db = await initDB();

  // Try to get cached data
  const cachedData = await getCachedData(db, url);
  if (cachedData) {
    console.log("Worker: Returning cached data for:", url);
    return cachedData;
  }

  try {
    console.log("Worker: Fetching data from:", url);
    const response = await fetch(url, {
      credentials: "include",
      mode: "cors",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log("Worker: Data fetched successfully:", data);

    // Cache the new data
    await cacheData(db, url, data);

    return data;
  } catch (error) {
    console.error("Worker: Error fetching data:", error);
    throw error;
  }
}

// Function to get cached data from IndexedDB
function getCachedData(db, url) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["cache"], "readonly");
    const objectStore = transaction.objectStore("cache");
    const request = objectStore.get(url);

    request.onerror = function (event) {
      console.error("Error reading cached data:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = function (event) {
      resolve(event.target.result ? event.target.result.data : null);
    };
  });
}

// Function to cache data in IndexedDB
function cacheData(db, url, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["cache"], "readwrite");
    const objectStore = transaction.objectStore("cache");
    const request = objectStore.put({ url: url, data: data });

    request.onerror = function (event) {
      console.error("Error caching data:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = function (event) {
      console.log("Data cached successfully");
      resolve();
    };
  });
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
