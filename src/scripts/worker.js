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
