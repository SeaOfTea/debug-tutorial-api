'use strict'
let restify = require('restify');
let server = restify.createServer({});

server.get('/', (req, res, next) => {
  let response = 'Debug App';
  res.send(200, response);
  return next();
});

server.listen(2000, () => {
  console.log('listening at port 2000');
});