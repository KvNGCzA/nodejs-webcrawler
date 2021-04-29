const { parentPort } = require('worker_threads');
const getUrls = require('./');

parentPort.on('message', async ({ url, hostUrl }) => {
  const pageLinks = await getUrls(url, hostUrl);

  parentPort.postMessage({ type: 'done', pageLinks });
});
