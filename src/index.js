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

      const pageLinks = [];

      links.length && links.each((i, el) => {
        const item = $(el).attr("href");

        pageLinks.push(item);
      });

      forward.length && forward.each((i, el) => {
        const item = $(el).attr("href");

        if (url[url.length - 1] === '/') {
          pageLinks.push(url.substring(0, url.length - 1) + item);
        } else {
          pageLinks.push(url + item);
        }
      });

      linkTable
        .push({ url, status: 'unvisited' })
        .write();
      const promises = [];
      
      [...new Set(pageLinks)].forEach(link => {
        const post = db
          .get('link')
          .find({ link })
          .value();

        if (!post) {
          linkTable
            .push({ link, status: 'unvisited' })
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

export default getUrls;