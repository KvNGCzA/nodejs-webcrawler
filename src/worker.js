const { join } = require('path');
const WorkerThread = require('worker_threads');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('src/database/db.json');
const db = low(adapter);

// Set some defaults
const linkTable = db.has('link')
  .value();

if (!linkTable) {
  db.defaults({ link: [] })
    .write();
}

/**
 * before running Modify THREAD_COUNT
 */
let i = 0;
let y = 0

const worker = async (neededUrls) => {
  function handleWorkerFinished(worker, workerNumber, url) {
    if (require('./database/database').new.size > 0) {
      console.log('adding again');
      // worker.postMessage({ url: newData.entries[0] });
      i += 1;
    } else {
      y += 1;
      // worker.kill();
      console.log(`Worker number ${workerNumber} completed working! ${url}, ${y} Free workers`);
    }

    if (y === neededUrls.length) {
      console.log('exiting last worker', workerNumber, y);
      process.exit(0);
    }
  }

  //Spin up our initial batch of workers... we will reuse these workers by sending more work as they finish
  for (let j = 0; j < neededUrls.length; j += 1) {
    const worker = new WorkerThread.Worker(join(__dirname, './work.js'));
    worker.postMessage({ url: neededUrls[i] });
    i += 1;

    //Listen on messages from the worker
    worker.on('message', (messageBody) => {
      //Switch on values in message body, to support different types of message
      if (messageBody.type === 'done') {
        handleWorkerFinished(worker, j, messageBody.url);
      }
    });
  }
};

module.exports = {
  worker,
  DataBase: db
};