import eraseNodes from "./utils/node-eraser.js";

const imageInput = document.getElementById("image-input");
const outputContainer = document.getElementById("output-container");
const timingContainer = document.getElementById("timing-results");
const loader = document.getElementById("loader");
let imageCount = 0;

imageInput.addEventListener("change", () => {
  const files = Array.from(imageInput.files);
  imageCount = files.length;
  console.log(imageCount);
  if (files.length > 0) {
    processImages(files, imageCount);
  }
});

function showLoader() {
  loader.classList.add("visible");
}

function hideLoader() {
  loader.classList.remove("visible");
}

async function processImages(files, imageCount) {
  showLoader();
  eraseNodes(outputContainer);
  eraseNodes(timingContainer);
  const masterWorker = new Worker("scripts/master-worker.js");
  const processingTypes = ["brightness", "crop", "round"];

  const startTime = performance.now();

  try {
    const result = await createMasterWorkerPromise(
      masterWorker,
      files,
      processingTypes
    );
    if (result.error) {
      displayError(result.error);
    } else {
      displayProcessedImages(result.processedImages);
      displayTimingResults(result.timingResults, processingTypes, imageCount);
    }
  } catch (error) {
    displayError(`Error in master worker: ${error.message}`);
  } finally {
    masterWorker.terminate();
    hideLoader();
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;

  updateTotalTime(totalTime);
}

function createMasterWorkerPromise(worker, files, processingTypes) {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      resolve(event.data);
    };
    worker.onerror = reject;
    worker.postMessage({ files, processingTypes });
  });
}

function displayError(message) {
  eraseNodes(outputContainer);
  const errorElement = document.createElement("p");
  errorElement.textContent = `Error: ${message}`;
  errorElement.style.color = "red";
  outputContainer.appendChild(errorElement);
}

function displayTimingResults(timingResults, processingTypes, imageCount) {
  eraseNodes(timingContainer);

  const title = document.createElement("h3");
  title.textContent = "Timing Results:";

  const typeTitle = document.createElement("h4");
  typeTitle.textContent = "Processing Types:";

  const typeList = document.createElement("ul");

  let totalTime = 0;
  processingTypes.forEach((type) => {
    const listItem = document.createElement("li");
    const time = timingResults[type];
    listItem.textContent = `${type}: ${(time / imageCount).toFixed(2)} ms`;
    typeList.append(listItem);
    totalTime += time;
  });

  const totalTimeP = document.createElement("p");
  totalTimeP.textContent = `Total processing time: ${(
    totalTime / imageCount
  ).toFixed(2)} ms`;

  timingContainer.append(title, typeTitle, typeList, totalTimeP);
}

function displayProcessedImages(processedImages) {
  eraseNodes(outputContainer);

  processedImages.forEach((imageSet, index) => {
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-set";

    const imageTitle = document.createElement("h4");
    imageTitle.textContent = `Image ${index + 1}`;
    imageContainer.appendChild(imageTitle);

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "image-wrapper";

    imageSet.forEach(({ type, data }) => {
      const img = document.createElement("img");
      img.src = data;
      img.className = "output-image";
      img.title = `${type} processed`;
      imageWrapper.appendChild(img);
    });

    imageContainer.appendChild(imageWrapper);
    outputContainer.appendChild(imageContainer);
  });
}
