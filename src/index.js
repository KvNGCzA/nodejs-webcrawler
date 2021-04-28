const axios = require("axios");
const cheerio = require("cheerio");
const db = require("./worker").DataBase;
// var HttpsProxyAgent = require('https-proxy-agent');

const extractLastSlash = (url) => {
  return url[url.length - 1] === '/' ?
    url.substring(0, url.length - 1) : url;
}

const getUrls = async (url) => {

  // const httpsAgent = new HttpsProxyAgent(proxy);
  const prefix = url.match(/https:\/\/|http:\/\//);
  let hostUrl = new URL(url);
  hostUrl = prefix[0] ? prefix[0] + hostUrl.host : 'https://' + hostUrl.host;

  const sanitizedUrl = extractLastSlash(hostUrl);

  const config = {
    method: "GET",
    url,
    // httpsAgent,
  };

  try {
    const res = await axios.request(config);
    const linkTable = db.get('link');

    if (res.status === 200) {
      const $ = cheerio.load(res.data);
      let links = $(`a[href^="${hostUrl}"]`) || [];
      let forward = $(`a[href^="/"]`) || [];

      if (!links.length && !forward.length) {
        // console.log('no links found');
        return;
      }

      const pageLinks = new Set();

      links.length && links.each((i, el) => {
        const item = $(el).attr("href");
        pageLinks.add(extractLastSlash(item));
      });

      forward.length && forward.each((i, el) => {
        const item = $(el).attr("href");
        pageLinks.add(sanitizedUrl + extractLastSlash(item));
      });

      let post = db
        .get('link')
        .find({
          link: sanitizedUrl
        })
        .value();

        if (!post) {
          linkTable
            .push({
              link: url
            })
            .write();
        }
  
      const promises = [];

      pageLinks.forEach(link => {
        post = db
          .get('link')
          .find({
            link
          })
          .value();

        if (!post) {
          linkTable
            .push({
              link
            })
            .write();

          promises.push(getUrls(link));
          console.log('link', link);
        }
      });

      if (promises.length) {
        return await Promise.all(promises);
      }

      return;


      // console.log(pageLinks.length);
      // console.log([...new Set(pageLinks)].length);
    }

  } catch (error) {
    // console.log('error', error);
  }
};

const specificNoOfUrls = new Set();
let retries = 0;
const specificNumberOfUrls = async (url, n) => {
  const prefix = url.match(/https:\/\/|http:\/\//);
  if (specificNoOfUrls.size === n) {
    return specificNoOfUrls;
  }
  let hostUrl = new URL(url);
  hostUrl = prefix[0] ? prefix[0] + hostUrl.host : 'https://' + hostUrl.host;

  const sanitizedUrl = extractLastSlash(hostUrl);
  const config = {
    method: "GET",
    url,
    // httpsAgent,
  };

  try {

    const res = await axios.request(config);

    if (res.status === 200) {
      const $ = cheerio.load(res.data);
      let links = $(`a[href*="${hostUrl}"]`) || [];
      let forward = $(`a[href^="/"]`) || [];

      if (!links.length && !forward.length) {
        if (retries < specificNoOfUrls.size) {
          retries += 1;
          console.log(`Got ${specificNoOfUrls.size} links out of ${n}, getting more...`);
          try {
            return await specificNumberOfUrls(
              Array.from(specificNoOfUrls)[Math.floor(Math.random() * specificNoOfUrls.size)],
              n
            );
          } catch (error) {
            return await specificNumberOfUrls(
              Array.from(specificNoOfUrls)[Math.floor(Math.random() * specificNoOfUrls.size)],
              n
            );
          }
        } else {
          return specificNoOfUrls;
        }
      }

      for (let x = 0; x < links.length; x += 1) {
        if (specificNoOfUrls.size === n) {
          return specificNoOfUrls;
        }

        const item = $(links[x]).attr("href");
        specificNoOfUrls.add(extractLastSlash(item));

      }

      for (let x = 0; x < forward.length; x += 1) {
        if (specificNoOfUrls.size === n) {
          return specificNoOfUrls;
        }
        const item = $(forward[x]).attr("href");
        if (item.length > 1) {
          specificNoOfUrls.add(sanitizedUrl + extractLastSlash(item));
        }
      }

      if (specificNoOfUrls.size < n && retries < specificNoOfUrls.size) {
        retries += 1;
        console.log(`Got ${specificNoOfUrls.size} links out of ${n}, getting more...`);

        try {
          return await specificNumberOfUrls(
            Array.from(specificNoOfUrls)[Math.floor(Math.random() * specificNoOfUrls.size)],
            n
          );
        } catch (error) {
          console.log('error 173', error);
          return await specificNumberOfUrls(
            Array.from(specificNoOfUrls)[Math.floor(Math.random() * specificNoOfUrls.size)],
            n
          );
        }
      }

      return specificNoOfUrls;
    }
  } catch (error) {
    console.log('error', error);
    return await specificNumberOfUrls(
      Array.from(specificNoOfUrls)[Math.floor(Math.random() * specificNoOfUrls.size)],
      n
    );
  }
};

module.exports = getUrls;
module.exports.specificNumberOfUrls = specificNumberOfUrls;