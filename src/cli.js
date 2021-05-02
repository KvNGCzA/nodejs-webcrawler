const inquirer = require('inquirer');
const chalk = require('chalk');
const init = require('./worker');
const { getPrefix } = require('./helper');
// import Proxies from "./Proxies";

const arg = require("arg");
const log = console.log;

const logErr = errMsg => {
  log(chalk.red(errMsg));
};

const parseArgs = rawArgs => {
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
    numberOfWorkers: args['--num'],
  }
}

const promptForMissing = async options => {
  const questions = [];
  if (!options.url || !getPrefix(options.url)) {
    const message = !options.url ?
      'please enter a valid url e.g "https://example.com":' :
        'please prefix your url with "https" or "http":';

    questions.push({
      type: 'input',
      name: 'url',
      message,
      validate: (value) => {
        if (value && getPrefix(value)) {
          return true;
        }

        return false;
      },
    });
  }

  if (!options.numberOfWorkers || isNaN(options.numberOfWorkers)) {
    const message = options.numberOfWorkers === undefined ?
      'please enter the number of workers you would like to use, else it will default to 1:' :
        'please enter a valid number:';

    questions.push({
      type: 'number',
      name: 'numberOfWorkers',
      message,
      default: 1
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    url: answers.url || options.url,
    numberOfWorkers: answers.numberOfWorkers || options.numberOfWorkers
  }
}

const cli = async (args) => {
  let options;
  try {
    options = parseArgs(args);
  } catch (error) {
    logErr('an error occured, please provide an argument for -n and -u flags');
    process.exit();
  }
  options = await promptForMissing(options);

  log('Crawler started:', options);

  /**
   * Using proxies to mask users ips from getting blocked
   * Update: Skipping this step because it causes more problems
   * than it fixes. For a real application being deployed to
   * production, this is an important feature.
   */
  // const proxies = new Proxies();
  // await proxies.generate();
  // const proxy = proxies.getProxy();
  // log('proxy', proxy);

  const numOfWorkers = options.numberOfWorkers;
  const url = options.url;

  if (isNaN(numOfWorkers)) {
    logErr('number of workers must be a valid number');
  } else {
    init(url, numOfWorkers);
  }
}

module.exports = cli;