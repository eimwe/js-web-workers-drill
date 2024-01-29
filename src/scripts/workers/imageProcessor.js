import createWorker from "../workers/helper.js";

const imageProcessorWorker = createWorker(() => {
  self.onmessage = (event) => {
    const imageData = event.data;
    const data = imageData.data;

    for (let iteration = 0; iteration < 100; iteration++) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(data[i] + 1, 255); // Increase red component
        data[i + 1] = Math.min(data[i + 1] + 1, 255); // Increase green component
        data[i + 2] = Math.min(data[i + 2] + 1, 255); // Increase blue component
      }
    }

    self.postMessage(imageData);
  };
});

export default imageProcessorWorker;
