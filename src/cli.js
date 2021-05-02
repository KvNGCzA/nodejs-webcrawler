const inquirer = require('inquirer');
const chalk = require('chalk');
const init = require('./worker');
const { getPrefix } = require('./helper');

const arg = require('arg');
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
    logErr('An error occurred, please provide valid arguments for -n and -u flags');
    process.exit(9);
  }
  options = await promptForMissing(options);

  const numOfWorkers = options.numberOfWorkers;
  const url = options.url;

  if (isNaN(numOfWorkers)) {
    logErr('number of workers must be a valid number');
  } else {
    log('Crawler started:', options);
    await init(url, numOfWorkers);
  }
}

module.exports = cli;