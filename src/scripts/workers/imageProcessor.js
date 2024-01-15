import createWorker from "../workers/helper.js";

const imageProcessorWorker = createWorker(() => {
  //Grayscale filter
  self.onmessage = (event) => {
    const imageData = event.data;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = avg;
    }

    self.postMessage(imageData);
  };
});

export default imageProcessorWorker;
