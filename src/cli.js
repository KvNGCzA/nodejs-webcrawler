const inquirer = require('inquirer');
const worker = require('./worker').worker;
const specificNumberOfUrls = require('./');
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
    try {
      neededUrls = await specificNumberOfUrls.specificNumberOfUrls(options.url, options.worker);
      console.log(`Got ${neededUrls.size} to start scrapping`, neededUrls);
    } catch (error) {
      console.log('error cli', error);
    }
  } else {
    neededUrls.add(options.url);
  }

  await worker(Array.from(neededUrls));
}