const getUrlDetails = (url) => {
  const hostUrl = new URL(url);
  const regex = hostUrl.host.includes('www.') ?
    /(?<=www\.)(.*)(?=\..*)/ :
      /(.*)(?=\..*)/;
  const base = hostUrl.host.match(regex)[0];

  return { base, host: hostUrl.host };
};

const getPrefixedHost = url => {
  const prefix = getPrefix(url);
  const hostUrl = new URL(url);

  return prefix ? prefix + hostUrl.host : 'https://' + hostUrl.host
}

const removeLastSlash = (url) => {
  return url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url;
};

const getPrefix = (url) => {
  const prefix = url.match(/https:\/\/|http:\/\//);

  return prefix ? prefix[0] : null;
};

module.exports = {
  getPrefix,
  getPrefixedHost,
  getUrlDetails,
  removeLastSlash
};
