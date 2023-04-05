const express = require('express');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const NodeCache = require( "node-cache" );

const app = express();
const cache = new NodeCache();
const PORT = process.env.PORT || 3002;

// Define a function to handle the request
const handleRequest = (request, response) => {
  // Check if the request is already cached
  const key = request.url;
  const cachedResponse = cache.get(key);
  if (cachedResponse) {
    // If the response is cached, return it
    console.log(`Serving from cache: ${key}`);
    return response.status(200).json(cachedResponse);
  }

  // If the response is not cached, perform the operation asynchronously
  console.log(`Processing request: ${key}`);
  setTimeout(() => {
    const responseData = {
      message: 'Hello Docker!',
    };
    cache.set(key, responseData);
    console.log(`Caching response: ${key}`);
    return response.status(200).json(responseData);
  }, 1000);
};

// Use clustering to take advantage of multiple CPU cores
if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for worker exit events
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  // Set up the server
  app.get('/', handleRequest);

  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} is up on localhost:${PORT}`);
  });
}