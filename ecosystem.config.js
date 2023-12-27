module.exports = {
    apps : [
        {
           name   : "prerender",
           script : "./server.js",
           watch  : true,
           env: {
              "CHROME_APPLICATION_PATH": "/usr/bin/google-chrome",
              "DEFAULT_USER_AGENT": "toplistbot",
              "CHROME_REMOTE_DEBUGGING_PORT": 9222,
              "TIMEOUT_FOR_PAGE_FULLY_LOAD": 5000,
              "TIMEOUT_FOR_PENDING_REQUEST_CHECK": 5000,
              "MONGO_DB_DATABASE_NAME": "prerender",
              "MONGO_DB_CACHE_COLLECTION": "cache",
              "200_STATUS_CACHE_DAYS": 30,
              "404_STATUS_CACHE_DAYS": 1,
              "302_STATUS_CACHE_DAYS": 0,
              "301_STATUS_CACHE_DAYS": 0,
              "IN_PARALLEL_RENDER_URLS_COUNT": 5,
              "EXPRESS_SERVER_PORT": 3000,
              "JWT_SECRET": "b889a1e0f8d85f8f3dc608516f1755ca9a048783f4d14e038865772859222d0d;",
              "GOOGLE_CLIENT_ID": "976780435712-tto9pd3ubf7f0ot46j37ojcc43mj0d9j.apps.googleusercontent.com"
           }
        }
    ]
  }