importScripts("https://www.lactame.com/lib/image-js/0.21.2/image.min.js");

self.onmessage = async (event) => {
  const { imageData, type } = event.data;
  try {
    const processedImageData = await processImage(imageData, type);
    self.postMessage({ processedImageData });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};

async function processImage(imageData, type) {
  const image = await IJS.Image.load(imageData);

  switch (type) {
    case "brightness":
      return adjustBrightness(image);
    case "crop":
      return cropImage(image);
    case "round":
      return roundImage(image);
    default:
      throw new Error(`Unknown processing type: ${type}`);
  }
}

function adjustBrightness(image) {
  const brightnessFactor = 50;
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = Math.min(image.data[i] + brightnessFactor, 255); // Red
    image.data[i + 1] = Math.min(image.data[i + 1] + brightnessFactor, 255); // Green
    image.data[i + 2] = Math.min(image.data[i + 2] + brightnessFactor, 255); // Blue
  }
  return image.toDataURL();
}

function cropImage(image) {
  const size = Math.min(image.width, image.height);
  const x = (image.width - size) / 2;
  const y = (image.height - size) / 2;
  return image.crop({ x, y, width: size, height: size }).toDataURL();
}

function roundImage(image) {
  const size = Math.min(image.width, image.height);
  const newImage = new IJS.Image(size, size, { alpha: 1 });

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const dx = x - size / 2;
      const dy = y - size / 2;
      if (dx * dx + dy * dy <= (size / 2) * (size / 2)) {
        const srcX = Math.floor(x + (image.width - size) / 2);
        const srcY = Math.floor(y + (image.height - size) / 2);
        const srcIndex = (srcY * image.width + srcX) * 4;
        const dstIndex = (y * size + x) * 4;
        newImage.data[dstIndex] = image.data[srcIndex];
        newImage.data[dstIndex + 1] = image.data[srcIndex + 1];
        newImage.data[dstIndex + 2] = image.data[srcIndex + 2];
        newImage.data[dstIndex + 3] = 255; // Fully opaque
      } else {
        const dstIndex = (y * size + x) * 4;
        newImage.data[dstIndex + 3] = 0; // Fully transparent
      }
    }
  }
  return newImage.toDataURL();
}
