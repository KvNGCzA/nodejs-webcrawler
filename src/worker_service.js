const { parentPort } = require('worker_threads');
const getUrls = require('./index');

parentPort.on('message', async ({ url }) => {
  const pageLinks = await getUrls(url);

  parentPort.postMessage({ type: 'done', pageLinks });
});
