const axios = require("axios");
const cheerio = require("cheerio");

export default class Proxies {
  constructor() {
    this.ip_addresses = [];
    this.port_numbers = [];
  }

  async generate() {
    try {
      const ip_addresses = [];
      const port_numbers = [];
      const res = await axios.get("https://sslproxies.org/");
      if (res.status === 200) {
        const $ = cheerio.load(res.data);

        $("td:nth-child(1)").each(function() {
          ip_addresses.push($(this).text());
        });

        $("td:nth-child(2)").each(function() {
          port_numbers.push($(this).text());
        });
        this.ip_addresses = ip_addresses;
        this.port_numbers = port_numbers;
      } else {
        console.log('encountered some kind of error');
      }
    } catch (error) {
      console.log('error', error);
    }
  }

  getProxy(x) {
    return `https://${this.ip_addresses[x]}:${this.port_numbers[x]}`;
  }
}