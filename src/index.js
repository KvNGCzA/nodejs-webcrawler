const axios = require("axios");
const cheerio = require("cheerio");
const chalk = require('chalk');
const { sanitizeUrl, removeLastSlash } = require("./helper");
const log = console.log;
// const HttpsProxyAgent = require('https-proxy-agent');


const getUrls = async (url, hostUrl) => {
  log(chalk.green(url));
  const pageLinks = new Set();

  try {
    const res = await axios.request({
      method: "GET",
      url
      // httpsAgent,
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
        pageLinks.add(sanitizeUrl(hostUrl) + removeLastSlash(item));
      });

      return pageLinks;
    }

    return pageLinks;
  } catch (error) {
    return pageLinks;
  }
};


module.exports = getUrls;