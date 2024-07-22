const imageInput = document.getElementById("imageInput");
const outputContainer = document.getElementById("outputContainer");

imageInput.addEventListener("change", () => {
  const files = Array.from(imageInput.files);
  if (files.length > 0) {
    processImages(files);
  }
});

async function processImages(files) {
  const workerPool = [
    new Worker("scripts/worker.js", { name: "Worker1" }),
    new Worker("scripts/worker.js", { name: "Worker2" }),
    new Worker("scripts/worker.js", { name: "Worker3" }),
  ];

  const taskQueue = files.map((file) => () => processImage(file, workerPool));
  const concurrencyLimit = workerPool.length;

  try {
    const processedImages = await runConcurrently(taskQueue, concurrencyLimit);
    displayProcessedImages(processedImages);
  } finally {
    workerPool.forEach((worker) => worker.terminate());
  }
}

async function processImage(file, workerPool) {
  const imageData = await readFileAsImageData(file);
  const worker = await getAvailableWorker(workerPool);

  try {
    return await createWorkerPromise(worker, imageData);
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

function displayProcessedImages(processedImages) {
  outputContainer.innerHTML = "";

  for (const imageData of processedImages) {
    const img = document.createElement("img");
    img.src = imageData;
    img.className = "outputImage";
    outputContainer.appendChild(img);
  }
}
