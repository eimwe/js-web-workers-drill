import eraseNodes from "./utils/node-eraser.js";

const imageInput = document.getElementById("imageInput");
const outputContainer = document.getElementById("outputContainer");
const timingContainer = document.getElementById("timingResults");

imageInput.addEventListener("change", () => {
  const files = Array.from(imageInput.files);
  if (files.length > 0) {
    processImages(files);
  }
});

async function processImages(files) {
  const startTime = performance.now();
  const workerPool = [];

  try {
    const processedImages = await processImagesInParallel(files, workerPool);
    displayProcessedImages(processedImages);
  } finally {
    workerPool.forEach((worker) => {
      worker.terminate();
    });
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;

  displayTimingResults(totalTime, workerPool);
}

async function processImagesInParallel(files, workerPool) {
  const tasks = files.map((file) => {
    const worker = new Worker("scripts/worker.js");
    workerPool.push(worker);
    return processImageWithWorker(worker, file);
  });

  return Promise.all(tasks);
}

async function processImageWithWorker(worker, file) {
  const imageData = await readFileAsImageData(file);
  const startTime = performance.now();

  try {
    const result = await createWorkerPromise(worker, imageData);
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    worker.totalTime = processingTime;
    return result;
  } catch (error) {
    console.error(`Error processing image with worker:`, error);
    throw error;
  }
}

function readFileAsImageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createWorkerPromise(worker, imageData) {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const { processedImageData } = event.data;
      resolve(processedImageData);
    };
    worker.onerror = reject;
    worker.postMessage({ imageData, tasks: ["brightness", "crop", "round"] });
  });
}

function displayTimingResults(totalTime, workerPool) {
  eraseNodes(timingContainer);

  const title = document.createElement("h3");
  title.textContent = "Timing Results:";

  const totalTimeP = document.createElement("p");
  totalTimeP.textContent = `Total processing time: ${totalTime.toFixed(2)} ms`;

  const workerTitle = document.createElement("h4");
  workerTitle.textContent = "Individual Worker Times:";

  const workerList = document.createElement("ul");
  workerPool.forEach((worker, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `Worker ${index + 1}: ${worker.totalTime.toFixed(
      2
    )} ms`;
    workerList.append(listItem);
  });

  timingContainer.append(title, totalTimeP, workerTitle, workerList);
}

function displayProcessedImages(processedImages) {
  eraseNodes(outputContainer);

  const fragment = document.createDocumentFragment();

  for (const imageData of processedImages) {
    const img = document.createElement("img");
    img.src = imageData;
    img.className = "outputImage";
    fragment.append(img);
  }

  outputContainer.append(fragment);
}
