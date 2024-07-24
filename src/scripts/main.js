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
  const workerPool = [
    new Worker("scripts/worker.js"),
    new Worker("scripts/worker.js"),
    new Worker("scripts/worker.js"),
  ];

  workerPool.forEach((worker, index) => {
    worker.name = `Worker${index + 1}`;
    worker.totalTime = 0;
  });

  const taskQueue = files.map((file) => () => processImage(file, workerPool));
  const concurrencyLimit = workerPool.length;

  const startTime = performance.now();

  try {
    const processedImages = await runConcurrently(taskQueue, concurrencyLimit);
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

async function processImage(file, workerPool) {
  const imageData = await readFileAsImageData(file);
  const worker = await getAvailableWorker(workerPool);

  const startTime = performance.now();
  try {
    const result = await createWorkerPromise(worker, imageData);
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    worker.totalTime += processingTime;
    return result;
  } finally {
    worker.busy = false;
  }
}

function getAvailableWorker(workerPool) {
  return new Promise((resolve) => {
    const checkWorkers = () => {
      const availableWorker = workerPool.find((worker) => !worker.busy);
      if (availableWorker) {
        availableWorker.busy = true;
        resolve(availableWorker);
      } else {
        setTimeout(checkWorkers, 10);
      }
    };
    checkWorkers();
  });
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
    worker.postMessage({ imageData });
  });
}

async function runConcurrently(tasks, concurrencyLimit) {
  const results = [];
  const runningTasks = new Set();

  for (const task of tasks) {
    const promise = task().then((result) => {
      results.push(result);
      runningTasks.delete(promise);
    });
    runningTasks.add(promise);
    if (runningTasks.size >= concurrencyLimit) {
      await Promise.race(runningTasks);
    }
  }

  await Promise.all(runningTasks);
  return results;
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
  workerPool.forEach((worker) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${worker.name}: ${worker.totalTime.toFixed(2)} ms`;
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
