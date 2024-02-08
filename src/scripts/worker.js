importScripts("https://www.lactame.com/lib/image-js/0.21.2/image.min.js");

self.onmessage = async (event) => {
  const base64String = event.data;
  const blob = await fetchImageData(base64String);
  const bitmap = await IJS.Image.load(blob);
  const processedBitmap = applyFilter(bitmap);
  const processedBase64String = await convertToBase64(processedBitmap);
  self.postMessage(processedBase64String);
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
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg; // Red
    data[i + 1] = avg; // Green
    data[i + 2] = avg; // Blue
  }

  return bitmap;
}

async function convertToBase64(bitmap) {
  const base64String = await bitmap.toDataURL();
  return base64String.split(",")[1];
}
