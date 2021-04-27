const { parentPort } = require('worker_threads');
const getUrls = require('./index');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('src/database/db.json');
const db = low(adapter);

parentPort.on('message', async ({ url }) => {
  await getUrls(url, db);

  parentPort.postMessage({ type: 'done', body: { key: 'value' } });
});
