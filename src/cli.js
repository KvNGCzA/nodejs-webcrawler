import inquirer from "inquirer";
import { specificNumberOfUrls } from './';
import worker from './worker';

// import Proxies from "./Proxies";
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('src/database/db.json');
const db = low(adapter);

// Set some defaults
db.defaults({ link: [] })
  .write();

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
    worker: args['--num'] || 1,
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

  console.log(options);
  // const proxies = new Proxies();
  // await proxies.generate();
  // const random_number = Math.floor(Math.random() * 100);
  // const proxy = proxies.getProxy(random_number);
  // console.log('proxy', proxy);
  let neededUrls = new Set();
  if (options.worker > 1) {
    neededUrls = await specificNumberOfUrls(options.url, options.worker);
  } else {
    neededUrls.add(options.url);
  }

  await worker(Array.from(neededUrls));
  // await crawler(options.url, db);
}