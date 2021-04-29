const { join } = require('path');
const WorkerThread = require('worker_threads');
const chalk = require('chalk');
const { sanitizeUrl, getHostUrl} = require('./helper');
const log = console.log;

let numberOfFreeWorkers = 0
let numberOfCreatedWorkers = 0
let maxNumOfWorkers = 0;
let hostUrl = null;
const visited = new Set();
const notVisited = new Set();
const freeWorkers = [];

function handleWorkerFinished(worker, workerNumber, pageLinks) {
  numberOfFreeWorkers += 1;
  freeWorkers.push({ worker, workerNumber });

  if (pageLinks && pageLinks.size) {
    pageLinks.forEach((link) => {
      if (!visited.has(link)) {
        notVisited.add(link);
      }
    });
  }

  // Reuse free workers if any
  if (freeWorkers.length && notVisited.size) {
    const availableLinks = Array.from(notVisited);
    let x = 0;
    while (freeWorkers.length && notVisited.size) {
      const link = availableLinks[x];
      x += 1;
      numberOfFreeWorkers -= 1;

      const {
        worker: currentWorker,
        // workerNumber: currentWorkerNumber
      } = freeWorkers[freeWorkers.length - 1];
      freeWorkers.pop();
      // log(chalk.yellow(`Worker number ${currentWorkerNumber + 1} reassigned to ${link}!`));
      notVisited.delete(link);
      currentWorker.postMessage({ url: link, hostUrl });
      visited.add(link);
    }
  }

  // Create new worker(s) if there are no free workers
  // Do not exceed number of specified workers
  let index = 0;
  const notVisitedSize = notVisited.size;
  if (numberOfCreatedWorkers < maxNumOfWorkers && notVisitedSize) {
    const availableLinks = Array.from(notVisited);

    while (numberOfCreatedWorkers < maxNumOfWorkers && numberOfCreatedWorkers < notVisitedSize) {
      index += 1;
      
      const newWorker = createWorker(numberOfCreatedWorkers);
      const link = availableLinks[index];

      visited.add(link);
      notVisited.delete(link);
      newWorker.postMessage({ url: link, hostUrl });
    }
  }

  // If all workers are free, end process
  if (numberOfFreeWorkers === numberOfCreatedWorkers) {
      log(chalk.yellow(`Crawled ${visited.size} link(s)`));
      log(chalk.yellow(`Created ${numberOfCreatedWorkers} worker(s) out of a possible ${maxNumOfWorkers}`));
      process.exit();
  }
}

const worker = async (url, numOfWorkers) => {
  maxNumOfWorkers = numOfWorkers;
  const worker = createWorker(numberOfCreatedWorkers);
  const link = sanitizeUrl(url);
  hostUrl = getHostUrl(link);

  visited.add(link);
  worker.postMessage({ url: link, hostUrl });
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