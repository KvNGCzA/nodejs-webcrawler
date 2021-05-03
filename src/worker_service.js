// const axios = require('axios-proxy-fix');
const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');
const wUrl = require('whatwg-url');
const UserAgent = require('user-agents');
const { parentPort } = require('worker_threads');
const { removeLastSlash, getPrefixedHost } = require('./helper');
const log = console.log;

parentPort.on('message', async workerData => {
  const pageLinks = await getUrls(workerData);

  parentPort.postMessage({ type: 'done', pageLinks });
});

const getUrls = async ({ url, urlDetails, proxy }) => {
  log(chalk.green(url));
  const pageLinks = new Set();

  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': new UserAgent() // mostly useless without the proxy being actively rotated
        /**
         * It is important to rotate the user agent when we
         * rotate the ip addresses to avoid detection.
         */
      },
      // proxy,
      /**
       * Using proxies to mask users ips from getting blocked
       * UPDATE: Skipping this step because it causes more problems
       * than it fixes. At the moment using free proxy providers
       * returns unreliable ips which slow the program down
       * or cause failures.
       * For a real application being deployed to
       * production, a premium ip provider will be used.
       * This is an important feature.
       * To use proxy, uncomment line 1, 29 and comment out line 2
       * Do not use proxy for google
       */
    });

    if (res.status === 200) {
      const $ = cheerio.load(res.data);
      const links = $(`a`) || [];

      if (!links.length) {
        // No links found
        return pageLinks;
      }

      links.each((i, el) => {
        const href = $(el).attr('href');

        if (href) {
          const parsedUrl = wUrl.parseURL(href);

          if (parsedUrl) {
            const parsedHost = parsedUrl.host;
            const regex1 = new RegExp(`(?!\\w)(\\.)?${urlDetails.base}(\\.)?(?!\\w)`);
            const regex2 = new RegExp(`^${urlDetails.base}\\.`);

            /**
             * This allows us get domains and their subdomains
             * e.g. google.com, mail.google.com, google.org,
             * yourplanyourplanet.sustainability.google e.t.c.
            */
            if (
              parsedHost &&
              (regex1.test(parsedHost) || regex2.test(parsedHost))
            ) {
              pageLinks.add(removeLastSlash(href));
            }
          } else if (href[0] === '/') {
            pageLinks.add(getPrefixedHost(url) + removeLastSlash(href));
          }
        }
      });

      return pageLinks;
    }

    return pageLinks;
  } catch (error) {
    // If page returns an error, return an empty set
    return pageLinks;
  }
};
