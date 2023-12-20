const express = require('express');
const { Chrome } = require('./lib/browser/chrome');
const { MongoDBClient } = require('./lib/server/mongo');
const { ApolloServer } = require('apollo-server-express');
const parseSitemap = require('./lib/utils/parse-sitemap');
const { typeDefs } = require('./lib/server/graphql/schema');
const { resolvers } = require('./lib/server/graphql/resolvers');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();
const port = process.env['EXPRESS_SERVER_PORT']; // Set the port number you want to use

let browser;
let mongo;

function getUserFromRequest(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

app.get('/prerender/sitemap', async (req, res) => {
  const {
    query: { path },
    headers: { 'user-agent': userAgent },
  } = req;

  browser.setUserAgent(userAgent);

  const parsedSitemap = await parseSitemap(path);

  const preparedPromises = parsedSitemap.reduce((acc, urlArray) => {
    const promisesArray = [];

    urlArray.map((url) => {
      promisesArray.push(() => getSiteMapUrl(url));
    });

    acc.push(promisesArray);

    return acc;
  }, []);

  for (const arr of preparedPromises) {
    await Promise.all(arr.map((fn) => fn()));
  }

  res.status(200).send('Sitemap prerender finished');
});

async function getSiteMapUrl(url) {
  const page = await browser.openNewTab({ targetUrl: url });
  const status = browser.pagesStatusCode[url];
  const content = page.pageContent;

  await mongo.insertCache({ url, content, status });
}

async function startServer() {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const userId = getUserFromRequest(req);
      const userAgent = req.headers['user-agent'];
      return { userId, userAgent };
    },
  });
  await apolloServer.start();

  apolloServer.applyMiddleware({ app, path: '/graphql' });
}

startServer();

// Start the server
app.listen(port, async () => {
  if (!browser) {
    browser = new Chrome();

    await browser.startBrowser();
    await browser.connectDevTools();
  }

  if (!mongo) {
    mongo = new MongoDBClient();

    await mongo.connect();
    await mongo.createTTLIndex();
  }

  console.log(`Server is running on port ${port}`);
});