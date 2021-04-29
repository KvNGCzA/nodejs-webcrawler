const axios = require("axios");
const cheerio = require("cheerio");
const chalk = require('chalk');
const log = console.log;
// const HttpsProxyAgent = require('https-proxy-agent');

const getHostUrl = (url) => {
  const prefix = url.match(/https:\/\/|http:\/\//);
  let hostUrl = new URL(url);

  return prefix ?
    prefix[0] + hostUrl.host :
    'https://' + hostUrl.host;
}

const sanitizeUrl = (url) => {
  const prefix = url.match(/https:\/\/|http:\/\//);

  return prefix ?
    extractLastSlash(url) : 'https://' + extractLastSlash(url);
}

const extractLastSlash = (url) => {
  return url[url.length - 1] === '/' ?
    url.substring(0, url.length - 1) : url;
}

const getUrls = async (url) => {
  log(chalk.green(url));
  const sanitizedUrl = sanitizeUrl(url);
  const pageLinks = new Set();

  try {
    const res = await axios.request({
      method: "GET",
      url: sanitizedUrl
      // httpsAgent,
    });

    const hostUrl = getHostUrl(sanitizedUrl);

    if (res.status === 200) {
      const $ = cheerio.load(res.data);
      let links = $(`a[href^="${hostUrl}"]`) || [];
      let forward = $(`a[href^="/"]`) || [];

      if (!links.length && !forward.length) {
        return pageLinks;
      }


      links.length && links.each((i, el) => {
        const item = $(el).attr("href");
        pageLinks.add(extractLastSlash(item));
      });

      forward.length && forward.each((i, el) => {
        const item = $(el).attr("href");
        pageLinks.add(hostUrl + extractLastSlash(item));
      });

      return pageLinks;
    }

    return pageLinks;
  } catch (error) {
    return pageLinks;
  }
};


module.exports = getUrls;
module.exports.sanitizeUrl = sanitizeUrl;