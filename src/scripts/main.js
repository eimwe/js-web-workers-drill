const imageInput = document.getElementById("imageInput");
const outputImage = document.getElementById("outputImage");

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result.split(",")[1];
      const workerRed = new Worker("scripts/worker.js", {
        name: "Mr.Red",
      });
      const workerGreen = new Worker("scripts/worker.js", {
        name: "Mr.Green",
      });
      const workerBlue = new Worker("scripts/worker.js", {
        name: "Mr.Blue",
      });

      // Send base64 string to each worker
      workerRed.postMessage({ base64String, channel: "Red" });
      workerGreen.postMessage({ base64String, channel: "Green" });
      workerBlue.postMessage({ base64String, channel: "Blue" });

      let redProcessed = false;
      let greenProcessed = false;
      let blueProcessed = false;

      // Handle messages from each worker
      const handleWorkerMessage = (event) => {
        const { channel, processedBase64String } = event.data;
        if (channel === "Red") {
          redProcessed = true;
        } else if (channel === "Green") {
          greenProcessed = true;
        } else if (channel === "Blue") {
          blueProcessed = true;
        }

        // Update output image when all workers have completed processing
        if (redProcessed && greenProcessed && blueProcessed) {
          outputImage.src = "data:image/png;base64," + processedBase64String;
          workerRed.terminate();
          workerGreen.terminate();
          workerBlue.terminate();
        }
      };

      workerRed.onmessage = handleWorkerMessage;
      workerGreen.onmessage = handleWorkerMessage;
      workerBlue.onmessage = handleWorkerMessage;
    };
    reader.readAsDataURL(file);
  }
});
