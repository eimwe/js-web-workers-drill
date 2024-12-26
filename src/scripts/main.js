self.addEventListener("message", async (e) => {
  if (e.data.type === "fetchWithCredentials") {
    try {
      const response = await fetch("http://localhost:3000/api/check-cookie", {
        credentials: "include",
      });
      const data = await response.json();
      self.postMessage({
        type: "fetchResult",
        data: data,
        context: "worker",
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        error: error.message,
      });
    }
  }
});

// src/scripts/main.js
let worker = null;

async function mainThreadFetch() {
  try {
    // Set cookie first
    const setCookieResponse = await fetch(
      "http://localhost:3000/api/set-cookie",
      {
        credentials: "include",
      }
    );
    await setCookieResponse.json();

    // Then check cookie
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

// Attach to buttons when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("mainThreadBtn")
    .addEventListener("click", mainThreadFetch);
  document
    .getElementById("workerThreadBtn")
    .addEventListener("click", workerThreadFetch);
});
