/**
 * Represents the main image processing module using Web Workers.
 * @module imageProcessorWorker
 */

import imageProcessorWorker from "./workers/imageProcessor.js";

/**
 * The HTML element for inputting images.
 * @type {HTMLInputElement}
 */
const imageInput = document.getElementById("imageInput");

/**
 * The HTML canvas element for displaying the original image.
 * @type {HTMLCanvasElement}
 */
const originalCanvas = document.getElementById("originalCanvas");

/**
 * The HTML canvas element for displaying the processed image.
 * @type {HTMLCanvasElement}
 */
const processedCanvas = document.getElementById("processedCanvas");

/**
 * The HTML element container for filter buttons.
 * @type {HTMLElement}
 */
const filtersContainer = document.getElementById("filters");

/**
 * The HTML element container for displaying performance metrics.
 * @type {HTMLElement}
 */
const performanceMetricsContainer =
  document.getElementById("performanceMetrics");

/**
 * The original image loaded from the user's input.
 * @type {Image}
 */
let originalImage;

/**
 * The processed image after applying filters.
 * @type {ImageData}
 */
let processedImage;

/**
 * The currently active filter being applied to the image.
 * @type {string}
 */
let activeFilter;

/**
 * Event listener for changes in the image input. Loads the selected image and initializes the filter buttons.
 * @param {Event} event - The change event from the image input.
 */
imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = () => {
      originalImage = new Image();
      originalImage.src = reader.result;

      originalImage.onload = () => {
        originalCanvas.width = originalImage.width;
        originalCanvas.height = originalImage.height;
        processedCanvas.width = originalImage.width;
        processedCanvas.height = originalImage.height;

        const ctx = originalCanvas.getContext("2d");
        ctx.drawImage(originalImage, 0, 0);

        const originalImageData = ctx.getImageData(
          0,
          0,
          originalImage.width,
          originalImage.height
        );
        processedImage = new ImageData(
          new Uint8ClampedArray(originalImageData.data),
          originalImage.width,
          originalImage.height
        );

        loadFilters();
      };
    };

    reader.readAsDataURL(file);
  }
});

/**
 * Applies the selected filter to the processed image and updates the display.
 * @param {string} filter - The name of the filter to apply.
 */
const applyFilter = (filter) => {
  activeFilter = filter;

  const startTime = performance.now();

  // Sends the processed image data to the Web Worker for filtering.
  imageProcessorWorker.postMessage(processedImage);

  // Event listener for the response from the Web Worker.
  imageProcessorWorker.onmessage = (event) => {
    processedImage = event.data;

    // Updates the display with the processed image.
    const ctx = processedCanvas.getContext("2d");
    ctx.putImageData(processedImage, 0, 0);

    // Records and displays the processing time.
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    performanceMetricsContainer.textContent = `Filter: ${activeFilter}, Processing Time: ${processingTime.toFixed(
      2
    )} ms`;
  };
};

/**
 * Loads available filters as buttons in the UI.
 */
const loadFilters = () => {
  const availableFilters = ["Grayscale"];

  availableFilters.forEach((filter) => {
    const filterButton = document.createElement("button");
    filterButton.textContent = filter;
    filterButton.addEventListener("click", () => applyFilter(filter));
    filtersContainer.appendChild(filterButton);
  });
};
