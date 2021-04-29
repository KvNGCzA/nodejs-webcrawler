const inquirer = require('inquirer');
const chalk = require('chalk');
const worker = require('./worker');
// import Proxies from "./Proxies";

const arg = require("arg");

function parseArgs(rawArgs) {
  const args = arg({
    '--url': String,
    '--num': Number,
    '-u': '--url',
    '-n': '--num'
  }, {
    argv: rawArgs.slice(2),
  });

  return {
    url: args['--url'],
    worker: args['--num'],
  }
}

async function promptForMissing(options) {
  const questions = [];
  if (!options.url) {
    questions.push({
      type: 'input',
      name: 'url',
      message: 'please enter a valid url',
    });
  }

  if (!options.url) {
    questions.push({
      type: 'number',
      name: 'worker',
      message: 'please enter the number of workers you would like to use, else it will default to 1',
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    ...options,
    url: options.url || answers.url,
    worker: options.worker || answers.worker 
  }
}

export async function cli(args) {
  let options = parseArgs(args);
  options = await promptForMissing(options);

  // console.log(options);
  // const proxies = new Proxies();
  // await proxies.generate();
  // const random_number = Math.floor(Math.random() * 100);
  // const proxy = proxies.getProxy(random_number);
  // console.log('proxy', proxy);

  const numOfWorkers = options.worker || 1;
  const url = options.url;
  if (url) {
    await worker(url, numOfWorkers);
  } else {
    console.log(chalk.red('please enter a valid url'));
  }
}