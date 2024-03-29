const WebSocket = require("ws");
const https = require("https");
const express = require("express");
const path = require("path");
const fs = require("fs");

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let localIP;

  Object.keys(interfaces).forEach((iface) => {
    interfaces[iface].forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        localIP = details.address;
      }
    });
  });

  return localIP;
}

const localIPAddress = getLocalIP();

console.log('Local IP Address:', localIPAddress);

const app = express();
const server = https.createServer(
  {
    key: fs.readFileSync("../certificates/localhost-key.pem"),
    cert: fs.readFileSync("../certificates/localhost.pem"),
  },
  app
);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "client")));

const clients = new Set();
wss.on("connection", (ws) => {
  console.log("Client connected");

  clients.add(ws);

  ws.on("message", (message) => {
    console.log(message);
    if (message !== "revokeBlobURL") {
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("revokeBlobURL");
        console.log("Received signal to revoke Blob URL");
        clients.delete(ws);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, localIPAddress, () => {
  console.log(`Server running on ${localIPAddress}:${PORT}`);
});
