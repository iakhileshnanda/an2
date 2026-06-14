'use strict';

const { WebSocketServer } = require('ws');

let wss = null;

/**
 * Attach a WebSocket server at /ws onto an existing http.Server.
 * Clients connect and receive `{ type: 'about:update', data }` events whenever
 * about-me.md changes via the admin endpoint.
 * @param {import('http').Server} server
 */
function initWs(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'ws:connected', ts: Date.now() }));
    socket.on('error', () => {}); // don't let a dead client crash the process
  });

  console.log('[WS] live dashboard channel ready at /ws');
  return wss;
}

/** Broadcast an event object to every connected client. */
function broadcast(event) {
  if (!wss) return;
  const payload = JSON.stringify(event);
  for (const client of wss.clients) {
    // 1 === WebSocket.OPEN
    if (client.readyState === 1) client.send(payload);
  }
}

module.exports = { initWs, broadcast };
