const { join } = require('path');
const WorkerThread = require('worker_threads');
const chalk = require('chalk');
const log = console.log;
const sanitizeUrl = require('./').sanitizeUrl;

let y = 0
let initialCount = 0;
const visited = new Set();
const notVisited = new Set();
const freeWorker = [];

function handleWorkerFinished(worker, workerNumber, pageLinks) {
  y += 1;
  freeWorker.push({ worker, workerNumber });

  if (pageLinks && pageLinks.size) {
    pageLinks.forEach((link) => {
      if (!visited.has(link)) {
        notVisited.add(link);
      }
    });
  }

  // log(chalk.yellow(`Worker number ${workerNumber} completed working! ${y} Free workers`));

  if (freeWorker.length && notVisited.size) {
    const availableLinks = Array.from(notVisited);
    let x = 0;
    while (freeWorker.length && notVisited.size) {
      const link = availableLinks[x];
      x += 1;
      y -= 1;

      const {
        worker: currentWorker,
        // workerNumber: currentWorkerNumber
      } = freeWorker[freeWorker.length - 1];
      freeWorker.pop();
      // log(chalk.yellow(`Worker number ${currentWorkerNumber + 1} reassigned! ${y} Free workers`));
      notVisited.delete(link);
      currentWorker.postMessage({ url: link });
      visited.add(link);
    }

    return;
  }

  
  if (y === initialCount) {
      log(chalk.yellow(`${y} Free workers`));
      process.exit();
  }
}
const worker = async (urls, numOfWorkers) => {
  initialCount = numOfWorkers;
  //Spin up our initial batch of workers... we will reuse these workers by sending more work as they finish
  for (let j = 0; j < numOfWorkers; j += 1) {
    const worker = new WorkerThread.Worker(join(__dirname, './work.js'));

    //Listen on messages from the worker
    worker.on('message', (messageBody) => {
      if (messageBody.type === 'done') {
        handleWorkerFinished(worker, j, messageBody.pageLinks);
      }
    });

    if (urls[j]) {
      const link = sanitizeUrl(urls[j]);
      visited.add(link);
      worker.postMessage({ url: link });
    } else {
      y += 1;
      freeWorker.push({ worker, workerNumber: j });
    }
  }
};

module.exports = worker;