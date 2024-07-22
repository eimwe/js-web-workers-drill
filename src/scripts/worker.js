importScripts("https://www.lactame.com/lib/image-js/0.21.2/image.min.js");

self.onmessage = async (event) => {
  const { imageData } = event.data;
  const processedImageData = await processImage(imageData);
  self.postMessage({ processedImageData });
};

async function processImage(imageData) {
  const image = await IJS.Image.load(imageData);

  const brightnessFactor = 100;

  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = Math.min(image.data[i] + brightnessFactor, 255); // Red
    image.data[i + 1] = Math.min(image.data[i + 1] + brightnessFactor, 255); // Green
    image.data[i + 2] = Math.min(image.data[i + 2] + brightnessFactor, 255); // Blue
  }

  return image.toDataURL();
}
