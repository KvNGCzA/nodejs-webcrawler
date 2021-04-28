class FloatingUrls {
  constructor() {
      this.visited = new Set();
  }

  get url () {
    return this.visited;
  }

  seturl(url) {
    this.visited.add(url);
    console.log('this.visited', this.visited);
  }
}

global.DataStore = new FloatingUrls();

module.exports = global.DataStore;
