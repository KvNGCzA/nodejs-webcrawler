const { join } = require('path');
const WorkerThread = require('worker_threads');
const chalk = require('chalk');
const log = console.log;
const sanitizeUrl = require('.').sanitizeUrl;

let numberOfFreeWorkers = 0
let numberOfCreatedWorkers = 0
let initialCount = 0;
const visited = new Set();
const notVisited = new Set();
const freeWorker = [];

function handleWorkerFinished(worker, workerNumber, pageLinks) {
  numberOfFreeWorkers += 1;
  freeWorker.push({ worker, workerNumber });

  if (pageLinks && pageLinks.size) {
    pageLinks.forEach((link) => {
      if (!visited.has(link)) {
        notVisited.add(link);
      }
    });
  }

  if (freeWorker.length && notVisited.size) {
    const availableLinks = Array.from(notVisited);
    let x = 0;
    while (freeWorker.length && notVisited.size) {
      const link = availableLinks[x];
      x += 1;
      numberOfFreeWorkers -= 1;

      const {
        worker: currentWorker,
        // workerNumber: currentWorkerNumber
      } = freeWorker[freeWorker.length - 1];
      freeWorker.pop();
      // log(chalk.yellow(`Worker number ${currentWorkerNumber + 1} reassigned to ${link}!`));
      notVisited.delete(link);
      currentWorker.postMessage({ url: link });
      visited.add(link);
    }
  }

  // Create new worker(s)
  let index = 0;
  const notVisitedSize = notVisited.size;
  if (numberOfCreatedWorkers < initialCount && notVisitedSize) {
    const availableLinks = Array.from(notVisited);

    while (numberOfCreatedWorkers < initialCount && numberOfCreatedWorkers < notVisitedSize) {
      index += 1;
      
      const newWorker = createWorker(numberOfCreatedWorkers);
      const link = sanitizeUrl(availableLinks[index]);

      visited.add(link);
      notVisited.delete(link);
      newWorker.postMessage({ url: link });
    }
  }

  if (numberOfFreeWorkers === numberOfCreatedWorkers) {
      log(chalk.yellow(`Crawled ${visited.size} links`));
      process.exit();
  }
}

const worker = async (url, numOfWorkers) => {
  initialCount = numOfWorkers;
  const worker = createWorker(numberOfCreatedWorkers);
  const link = sanitizeUrl(url);

  visited.add(link);
  worker.postMessage({ url: link });
};

const createWorker = (index) => {
  numberOfCreatedWorkers += 1;
  const worker = new WorkerThread.Worker(join(__dirname, './worker_service.js'));

  //Listen on messages from the worker
  worker.on('message', (messageBody) => {
    if (messageBody.type === 'done') {
      handleWorkerFinished(worker, index, messageBody.pageLinks);
    }
  });

  return worker;
}

module.exports = worker;