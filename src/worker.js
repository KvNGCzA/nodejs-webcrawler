const { join } = require('path');
const WorkerThread = require('worker_threads');

/**
 * before running Modify THREAD_COUNT
 */
let i = 0;

export default async (neededUrls) => {
  // Define functions to handle the different messages passed by the workers
  function handleStatusReport(workerNumber, report) {
    console.log(`the worker:${workerNumber} says`, report.body || report);
  }

  function handleWorkerFinished(worker, workerNumber, message) {
    console.log(`done with ${JSON.stringify(message.body)}!`);
    if (i < neededUrls.length) {
      worker.postMessage(neededUrls[i]);
      i += 1;
    } else {
      console.log(`Worker number ${workerNumber} completed working!`);
    }
  }

  //Spin up our initial batch of workers... we will reuse these workers by sending more work as they finish
  for (let j = 0; j < neededUrls.length; j += 1) {
    const worker = new WorkerThread.Worker(join(__dirname, './index.js'));
    console.log(`Running ${i} of ${neededUrls.length}`);
    worker.postMessage(neededUrls[i]);
    i += 1;

    //Listen on messages from the worker
    worker.on('message', (messageBody) => {
      //Switch on values in message body, to support different types of message
      if (messageBody.type === 'done') {
        handleWorkerFinished(worker, j, messageBody);
      } else {
        handleStatusReport(j, messageBody);
      }
    });
  }
};
