// const axios = require("axios-proxy-fix");
const axios = require("axios");
const cheerio = require("cheerio");
const chalk = require('chalk');
const UserAgent = require('user-agents');
const { removeLastSlash } = require("./helper");
const log = console.log;

const getUrls = async ({ url, hostUrl, proxy }) => {
  log(chalk.green(url));
  const pageLinks = new Set();

  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': new UserAgent() // mostly useless without the proxy being actively rotated
        /**
         * It is important to rotate the user agent when we
         * rotate the ip address to avoid detection.
         */
      },
      // proxy, 
      /**
       * Using proxies to mask users ips from getting blocked
       * Update: Skipping this step because it causes more problems
       * than it fixes. At the moment using free proxy providers
       * returns unreliable ips which slow the program down
       * or cause failures.
       * For a real application being deployed to
       * production, this is an important feature.
       */
    });

    if (res.status === 200) {
      const $ = cheerio.load(res.data);

      // Get all links containing host url
      let links = $(`a[href^="${hostUrl}"]`) || [];
      // Get all links starting with forward slash
      let containsForwardSlash = $(`a[href^="/"]`) || [];

      if (!links.length && !containsForwardSlash.length) {
        // No links found
        return pageLinks;
      }

      links.length && links.each((i, el) => {
        const item = $(el).attr("href");
        pageLinks.add(removeLastSlash(item));
      });

      containsForwardSlash.length && containsForwardSlash.each((i, el) => {
        const item = $(el).attr("href");
        pageLinks.add(hostUrl + removeLastSlash(item));
      });

      return pageLinks;
    }

    return pageLinks;
  } catch (error) {
    // If page returns an error, return an empty set
    return pageLinks;
  }
};

module.exports = getUrls;
