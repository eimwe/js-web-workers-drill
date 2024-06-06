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

      // Function to create a promise for each worker
      const createWorkerPromise = (worker) => {
        return new Promise((resolve, reject) => {
          worker.onmessage = (event) => {
            const { channel, processedBase64String } = event.data;
            console.log(
              `Received processed data for ${channel} channel:`,
              processedBase64String
            );
            resolve({ channel, processedBase64String });
          };
        });
      };

      // Create promises for each worker
      const redPromise = createWorkerPromise(workerRed);
      const greenPromise = createWorkerPromise(workerGreen);
      const bluePromise = createWorkerPromise(workerBlue);

      // Wait for all promises to resolve
      Promise.all([redPromise, greenPromise, bluePromise]).then(
        async (processedDataArray) => {
          const [redData, greenData, blueData] = processedDataArray;

          // Load images from base64 strings using image-js
          const redImage = await IJS.Image.load(
            "data:image/png;base64," + redData.processedBase64String
          );
          const greenImage = await IJS.Image.load(
            "data:image/png;base64," + greenData.processedBase64String
          );
          const blueImage = await IJS.Image.load(
            "data:image/png;base64," + blueData.processedBase64String
          );

          // Combine channels
          const combinedImage = new IJS.Image(redImage.width, redImage.height);

          for (let y = 0; y < redImage.height; y++) {
            for (let x = 0; x < redImage.width; x++) {
              const redPixel = redImage.getPixelXY(x, y);
              const greenPixel = greenImage.getPixelXY(x, y);
              const bluePixel = blueImage.getPixelXY(x, y);

              combinedImage.setPixelXY(x, y, [
                redPixel[0],
                greenPixel[1],
                bluePixel[2],
                255, // Assuming full opacity for the combined image
              ]);
            }
          }

          // Convert combined image to base64 and set as src for outputImage
          const combinedBase64 = await combinedImage.toBase64("image/png");
          outputImage.src = "data:image/png;base64," + combinedBase64;

          // Terminate workers
          workerRed.terminate();
          workerGreen.terminate();
          workerBlue.terminate();
        }
      );
    };
    reader.readAsDataURL(file);
  }
});
