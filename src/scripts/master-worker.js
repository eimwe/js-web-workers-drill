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
  
  const timingResults = {};
  processingTypes.forEach(type => {
    timingResults[type] = 0;
  });

  const imageDataPromises = files.map(file => readFileAsImageData(file));
  const imagesData = await Promise.all(imageDataPromises);

  const processedImages = await Promise.all(
    imagesData.map(async (imageData, index) => {
      const processedSet = await Promise.all(
        processingTypes.map(async (type) => {
          const worker = workerPool.get(type);
          if (!worker) {
            throw new Error(`No worker available for processing type: ${type}`);
          }

          const startTime = performance.now();
          const channel = new MessageChannel();
          
          const result = await new Promise((resolve, reject) => {
            const messageHandler = (event) => {
              channel.port1.close();
              const { processedImageData, error } = event.data;
              if (error) {
                reject(new Error(error));
              } else {
                resolve({ type, data: processedImageData });
              }
            };

            channel.port1.onmessage = messageHandler;
            
            worker.postMessage(
              { 
                imageData,
                type,
                imageIndex: index
              },
              [channel.port2]
            );
          });

          const endTime = performance.now();
          timingResults[type] += (endTime - startTime);
          
          return result;
        })
      );
      
      return processedSet;
    })
  );

  return { processedImages, timingResults };
}

function readFileAsImageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

function terminateAllWorkers() {
  for (const worker of workerPool.values()) {
    worker.terminate();
  }
  workerPool.clear();
}