class FloatingUrls {
  constructor() {
      this.urls = [];
  }

  getUrl () {
    const url = this.url[this.url.length - 1];
    this.url = this.url.slice[0, this.url.length]
    return url;
  }

  set url(url) {
    this.url = [...this.url, url];
  }
}

const availableUrl = new FloatingUrls();

module.exports.availableUrl = availableUrl;
