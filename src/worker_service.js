const { parentPort } = require('worker_threads');
const getUrls = require('./');

parentPort.on('message', async workerData => {
  const pageLinks = await getUrls(workerData);

  parentPort.postMessage({ type: 'done', pageLinks });
});
