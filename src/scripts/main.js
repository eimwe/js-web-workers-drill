const worker = new Worker("scripts/worker.js");

console.log("Web worker created");

worker.onerror = function (error) {
  console.error("Error in worker:", error.message);
};

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

    console.log("Attempting to fetch users data from worker");
    const userData = await fetchFromWorker(
      "https://jsonplaceholder.typicode.com/users"
    );
    console.log("Users data fetched successfully");

    console.log("Attempting to fetch todos data from worker");
    const todosData = await fetchFromWorker(
      "https://jsonplaceholder.typicode.com/todos"
    );
    console.log("Todos data fetched successfully");

    console.log("Users data:", userData);
    console.log("Todos data:", todosData);
  } catch (error) {
    console.error("Error in caching example:", error);
  }
}

run();
