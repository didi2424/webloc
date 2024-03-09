const WebSocket = require("ws");
const https = require("https");
const express = require("express");
const path = require("path");
const fs = require("fs");

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

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, "192.168.1.6", () => {
  console.log(`Server running on https://192.168.1.6:${PORT}`);
});
