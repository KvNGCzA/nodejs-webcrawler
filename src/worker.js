const { join } = require('path');
const WorkerThread = require('worker_threads');
const chalk = require('chalk');
const { removeLastSlash, getHostUrl } = require('./helper');
const Proxies = require('./Proxies');
const log = console.log;

let numberOfCreatedWorkers = 0
let maxNumOfWorkers = 0;
let hostUrl = null;
const visited = new Set();
const notVisited = new Set();
const freeWorkers = [];
const proxies = new Proxies();

const  handleWorkerFinished = pageLinks => {
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
      const url = availableLinks[x];
      x += 1;

      const proxy = proxies.getProxy();
      const { worker } = freeWorkers[freeWorkers.length - 1];
      freeWorkers.pop();

      notVisited.delete(url);
      visited.add(url);
      worker.postMessage({ url, hostUrl, proxy });
    }
  }

  /**
   * Create new worker(s) if there are no free workers
   * Do not exceed number of specified workers
   * This ensures we never create more workers than we need
  */
  let index = 0;
  const notVisitedSize = notVisited.size;

  if (numberOfCreatedWorkers < maxNumOfWorkers && notVisitedSize) {
    const availableLinks = Array.from(notVisited);

    while (numberOfCreatedWorkers < maxNumOfWorkers && numberOfCreatedWorkers < notVisitedSize) {
      index += 1;

      const worker = createWorker(numberOfCreatedWorkers);
      const url = availableLinks[index];
      const proxy = proxies.getProxy();

      notVisited.delete(url);
      visited.add(url);
      worker.postMessage({ url, hostUrl, proxy });
    }
  }

  // If all workers are free, end process
  if (freeWorkers.length === numberOfCreatedWorkers) {
    log(chalk.yellow(`Crawled ${visited.size} link(s)`));
    log(chalk.yellow(`${numberOfCreatedWorkers} worker(s) used out of a possible ${maxNumOfWorkers}`));
    process.exit();
  }
}

const init = async (url, numOfWorkers) => {
  try {
    await proxies.generate();
  } catch (error) {
    log(chalk.red('error generating proxies'));
  }

  const proxy = proxies.getProxy();
  maxNumOfWorkers = numOfWorkers;
  const worker = createWorker(numberOfCreatedWorkers);
  const link = removeLastSlash(url);
  hostUrl = getHostUrl(url);

  visited.add(link);
  worker.postMessage({
    url: link,
    hostUrl,
    proxy
  });
};

const createWorker = workerNumber => {
  numberOfCreatedWorkers += 1;
  const worker = new WorkerThread.Worker(join(__dirname, 'worker_service.js'));

  //Listen on messages from the worker
  worker.on('message', messageBody => {
    if (messageBody.type === 'done') {
      freeWorkers.push({ worker, workerNumber });
      handleWorkerFinished(messageBody.pageLinks);
    }
  });

  return worker;
}

module.exports = init;
