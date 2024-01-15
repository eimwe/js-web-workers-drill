const createWorker = (workerFunction) => {
  const blob = new Blob([`(${workerFunction.toString()})()`], {
    type: "application/javascript",
  });
  return new Worker(URL.createObjectURL(blob));
};

export default createWorker;
