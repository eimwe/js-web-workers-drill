self.addEventListener("message", async (e) => {
  if (e.data.type === "fetchWithCredentials") {
    try {
      const response = await fetch("http://localhost:3000/api/check-cookie", {
        mode: "cors",
        method: "GET",
        cache: "default",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Worker-Header": "Checking cookie from Worker context",
        },
        redirect: "follow",
        referrer: "about:client",
        referrerPolicy: "no-referrer-when-downgrade",
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
