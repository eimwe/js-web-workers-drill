const workerPool = new Map();

self.onmessage = async (event) => {
  const { files, processingTypes } = event.data;
  try {
    const { processedImages, timingResults } = await processAllImages(
      files,
      processingTypes
    );
    self.postMessage({ processedImages, timingResults });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    terminateAllWorkers();
  }
};

async function processAllImages(files, processingTypes) {
  initializeWorkerPool(processingTypes);
  const processedImages = [];
  const timingResults = {};

  for (const file of files) {
    const { processedImageSet, timings } = await processImageSet(
      file,
      processingTypes
    );
    processedImages.push(processedImageSet);

    for (const [type, time] of Object.entries(timings)) {
      timingResults[type] = (timingResults[type] || 0) + time;
    }
  }

  return { processedImages, timingResults };
}

function initializeWorkerPool(processingTypes) {
  processingTypes.forEach((type) => {
    if (!workerPool.has(type)) {
      const worker = new Worker("processing-worker.js");
      worker.onerror = handleWorkerError;
      workerPool.set(type, worker);
    }
  });
}

function handleWorkerError(error) {
  console.error(`Worker error: ${error.message}`);
  self.postMessage({ error: `Worker error: ${error.message}` });
}

async function processImageSet(file, processingTypes) {
  const imageData = await readFileAsImageData(file);
  const processedImageSet = [];
  const timings = {};

  for (const type of processingTypes) {
    const startTime = performance.now();
    const processedImage = await processImage(imageData, type);
    const endTime = performance.now();

    processedImageSet.push(processedImage);
    timings[type] = endTime - startTime;
  }

  return { processedImageSet, timings };
}

async function processImage(imageData, processingType) {
  const worker = workerPool.get(processingType);
  if (!worker) {
    throw new Error(
      `No worker available for processing type: ${processingType}`
    );
  }

  return await createWorkerPromise(worker, imageData, processingType);
}

function readFileAsImageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createWorkerPromise(worker, imageData, processingType) {
  return new Promise((resolve, reject) => {
    const messageHandler = (event) => {
      worker.removeEventListener("message", messageHandler);
      const { processedImageData, error } = event.data;
      if (error) {
        reject(new Error(error));
      } else {
        resolve({ type: processingType, data: processedImageData });
      }
    };

    worker.addEventListener("message", messageHandler);
    worker.postMessage({ imageData, type: processingType });
  });
}

function terminateAllWorkers() {
  for (const worker of workerPool.values()) {
    worker.terminate();
  }
  workerPool.clear();
}
