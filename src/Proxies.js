const axios = require('axios');
const cheerio = require('cheerio');

const proxyProvider = 'https://sslproxies.org/';

class Proxies {
  constructor() {
    this.ipAddresses = [];
    this.portNumbers = [];
  }

  async generate() {
    try {
      const ipAddresses = [];
      const portNumbers = [];
      const res = await axios.get(proxyProvider);

      if (res.status === 200) {
        const $ = cheerio.load(res.data);

        $('td:nth-child(1)').each(function() {
          ipAddresses.push($(this).text());
        });

        $('td:nth-child(2)').each(function() {
          portNumbers.push(Number($(this).text()));
        });

        this.ipAddresses = ipAddresses;
        this.portNumbers = portNumbers;
      } else {
        console.log('encountered some kind of error');
      }
    } catch (error) {
      console.log('error', error);
    }
  }

  getProxy() {
    const proxyNum = Math.floor(Math.random() * this.ipAddresses.length);

    if (!this.ipAddresses.length) {
      return false
    }

    return {
      protocol: 'https',
      host: this.ipAddresses[proxyNum],
      port: this.portNumbers[proxyNum]
    }
  }
}

module.exports = Proxies;
