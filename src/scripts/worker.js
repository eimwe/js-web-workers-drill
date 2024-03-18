importScripts("https://www.lactame.com/lib/image-js/0.21.2/image.min.js");

self.onmessage = async (event) => {
  const { base64String, channel } = event.data;
  const blob = await fetchImageData(base64String);
  const bitmap = await IJS.Image.load(blob);
  const processedBitmap = applyFilter(bitmap, channel);
  const processedBase64String = await convertToBase64(processedBitmap);
  self.postMessage({ channel, processedBase64String });
};

async function fetchImageData(base64String) {
  const binaryString = atob(base64String);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "image/png" });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.readAsDataURL(blob);
  });
}

function applyFilter(bitmap) {
  const { width, height, data } = bitmap;

  for (let i = 0; i < width * height * 4; i += 4) {
    data[i] = Math.min(data[i] + 100, 255); // Red
    data[i + 1] = Math.min(data[i + 1] + 100, 255); // Green
    data[i + 2] = Math.min(data[i + 2] + 100, 255); // Blue
  }

  return bitmap;
}

async function convertToBase64(bitmap) {
  const base64String = await bitmap.toDataURL();
  return base64String.split(",")[1];
}
