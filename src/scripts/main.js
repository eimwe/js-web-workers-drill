document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("mainThreadBtn")
    .addEventListener("click", mainThreadFetch);
  document
    .getElementById("workerThreadBtn")
    .addEventListener("click", workerThreadFetch);
});

let worker = null;

async function mainThreadFetch() {
  try {
    // Set cookie
    const setCookieResponse = await fetch(
      "http://localhost:3000/api/set-cookie",
      {
        credentials: "include",
      }
    );
    await setCookieResponse.json();

    // Check cookie
    const checkResponse = await fetch(
      "http://localhost:3000/api/check-cookie",
      {
        credentials: "include",
      }
    );
    const data = await checkResponse.json();

    document.getElementById(
      "mainThreadResult"
    ).textContent = `Main Thread Result: ${JSON.stringify(data)}`;
  } catch (error) {
    console.error("Main thread error:", error);
  }
}

function workerThreadFetch() {
  if (!worker) {
    worker = new Worker("scripts/worker.js");

    worker.onmessage = (e) => {
      if (e.data.type === "fetchResult") {
        document.getElementById(
          "workerResult"
        ).textContent = `Worker Result: ${JSON.stringify(e.data.data)}`;
      } else if (e.data.type === "error") {
        console.error("Worker error:", e.data.error);
      }
    };
  }

  worker.postMessage({ type: "fetchWithCredentials" });
}
