const worker = new Worker("scripts/worker.js");

console.log("Web worker created");

worker.onerror = function (error) {
  console.error("Error in worker:", error.message);
};

async function fetchFromMainThread(url) {
  try {
    console.log("Fetching from main thread:", url);
    const response = await fetch(url, {
      credentials: "include",
    });
    const data = await response.json();
    console.log("Data fetched from main thread:", data);
    return data;
  } catch (error) {
    console.error("Error fetching from main thread:", error);
    throw error;
  }
}

function fetchFromWorker(url) {
  return new Promise((resolve, reject) => {
    console.log("Sending fetch request to worker:", url);
    worker.postMessage({ type: "fetch", url: url });

    worker.onmessage = function (event) {
      console.log("Received message from worker:", event.data);
      if (event.data.error) {
        console.error("Error from worker:", event.data.error);
        reject(new Error(event.data.error));
      } else {
        console.log("Data fetched from worker:", event.data);
        resolve(event.data);
      }
    };

    worker.onerror = function (error) {
      console.error("Worker error:", error);
      reject(error);
    };
  });
}

async function run() {
  try {
    console.log("Starting caching example");
    const mainThreadData = await fetchFromMainThread(
      "https://jsonplaceholder.typicode.com/users"
    );
    console.log("Main thread data fetched successfully");

    console.log("Attempting to fetch data from worker");
    const workerData = await fetchFromWorker(
      "https://jsonplaceholder.typicode.com/todos"
    );
    console.log("Worker data fetched successfully");

    console.log("Main thread data:", mainThreadData);
    console.log("Worker data:", workerData);
  } catch (error) {
    console.error("Error in caching example:", error);
  }
}

run();
