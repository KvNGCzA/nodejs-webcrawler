const axios = require("axios");
const cheerio = require("cheerio");
// var HttpsProxyAgent = require('https-proxy-agent');


const getUrls = async (url, db) => {
  // const httpsAgent = new HttpsProxyAgent(proxy);
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
      let links = $(`a[href^="${url}"]`) || [];
      let forward = $(`a[href^="/"]`) || [];

      if (!links.length && !forward.length) {
        // console.log('no links found');
        return;
      }

      const pageLinks = new Set();

      links.length && links.each((i, el) => {
        const item = $(el).attr("href");

        pageLinks.add(item);
      });

      forward.length && forward.each((i, el) => {
        const item = $(el).attr("href");

        if (url[url.length - 1] === '/') {
          pageLinks.add(url.substring(0, url.length - 1) + item);
        } else {
          pageLinks.add(url + item);
        }
      });

      let post = db
        .get('link')
        .find({
          link: url
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

          promises.push(getUrls(link, db));
        }

        console.log(link);

      });

      if (promises.length) {
        await Promise.all(promises);
      }

      // console.log(pageLinks.length);
      // console.log([...new Set(pageLinks)].length);
    }

  } catch (error) {
    // console.log('error', error);
  }
};

const specificNoOfUrls = new Set();

export const specificNumberOfUrls = async (url, n) => {
  const config = {
    method: "GET",
    url,
    // httpsAgent,
  };

  try {
    if (specificNoOfUrls.size === n) {
      return specificNoOfUrls;
    }

    const res = await axios.request(config);

    if (res.status === 200) {
      const $ = cheerio.load(res.data);
      let links = $(`a[href^="${url}"]`) || [];
      let forward = $(`a[href^="/"]`) || [];

      if (!links.length && !forward.length) {
        console.log('no links found');
        return specificNoOfUrls;
      }

      for (let x = 0; x < links.length; x += 1) {
        const item = $(links[x]).attr("href");
        specificNoOfUrls.add(item);

        if (specificNoOfUrls.size === n) {
          return specificNoOfUrls;
        }
      }

      for (let x = 0; x < forward.length; x += 1) {
        const item = $(forward[x]).attr("href");

        if (url[url.length - 1] === '/') {
          specificNoOfUrls.add(url.substring(0, url.length - 1) + item);
        } else {
          specificNoOfUrls.add(url + item);
        }

        if (specificNoOfUrls.size === n) {
          return specificNoOfUrls;
        }
      }

      if (specificNoOfUrls.size < n) {
        const promises = [];

        specificNoOfUrls.forEach(link => {
          promises.push(specificNumberOfUrls(link, n));
        });

        await Promise.all(promises);
      }
    }
  } catch (error) {
    console.log('error', error);
  }
};

export default getUrls;