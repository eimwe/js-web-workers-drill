const imageInput = document.getElementById("imageInput");
const outputImage = document.getElementById("outputImage");

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result.split(",")[1];
      const worker = new Worker("scripts/worker.js", {
        name: "imageProcessorWorker",
      });
      worker.postMessage(base64String);
      worker.onmessage = (event) => {
        outputImage.src = "data:image/png;base64," + event.data;
        worker.terminate();
      };
    };
    reader.readAsDataURL(file);
  }
});
