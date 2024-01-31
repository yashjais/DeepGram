const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const handleDeepGramWebSocketConnection = require('./websocket');

const port = 3020;
const app = express();

app.use(express.json());

app.use('/', (req, res) => {
  return res.send('hello');
});

const server = http.createServer(app);

const wssServer = new WebSocket.Server({ server });

wssServer.on('connection', handleDeepGramWebSocketConnection);

wssServer.on('error', (error) => {
  console.error('WebSocket connection error:', error);
});

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => {
  console.log('listening on the port', port);
});

server.on('error', (error) => {
  console.log('Server error:', error);
});

server.on('listening', () => {
  console.log('Server listening on port', port);
});