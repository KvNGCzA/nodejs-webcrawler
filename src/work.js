const { parentPort } = require('worker_threads');
const getUrls = require('./index');

parentPort.on('message', async ({ url }) => {
  await getUrls(url);

  parentPort.postMessage({ type: 'done', url });
});
