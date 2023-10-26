const xml2js = require("xml2js");
const fs = require("fs");

const parseSitemapFile = async (path) => {
  const xmlData = await fs.readFileSync(path, "utf-8");
  const parser = new xml2js.Parser();
  let parsedResult = {};

  await parser.parseString(xmlData, (err, result) => {
    if (err) {
      console.error("Error parsing XML:", err);
    } else {
      // The XML has been parsed and converted to a JavaScript object
      parsedResult = result;
    }
  });

  const {
    urlset: { url },
  } = parsedResult;

  return prepareSitemapArray(url);
};

const prepareSitemapArray = (urlObjArray) => {
  const urls = [];

  urlObjArray.forEach(({ loc }) => {
    urls.push(...loc);
  });

  // Specify the size of the smaller arrays
  const splitSize = Number(process.env['IN_PARALLEL_RENDER_URLS_COUNT']);

  // Initialize an array to hold the smaller arrays
  const smallerArrays = [];

  for (let i = 0; i < urls.length; i += splitSize) {
    smallerArrays.push(urls.slice(i, i + splitSize));
  }

  return smallerArrays;
}

module.exports = parseSitemapFile;
