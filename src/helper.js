// Return host url
// and include a prefix if url has none
// e.g https://crossover.com from crossover.com/something-else
const getHostUrl = (url) => {
  const prefix = getPrefix(url);
  let hostUrl = new URL(url);

  return prefix ? prefix + hostUrl.host : 'https://' + hostUrl.host;
};

// Return url without last forward slash
// e.g /something-else  /something-else/
const removeLastSlash = (url) => {
  return url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url;
};

// Return prefix attached to link
// e.g https:// or http://
const getPrefix = (url) => {
  const prefix = url.match(/https:\/\/|http:\/\//);

  return prefix ? prefix[0] : null;
};

module.exports = {
  getHostUrl,
  getPrefix,
  removeLastSlash
};
