const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

const trades = Array.from({ length: 3000 }, (_, i) => ({
  tradeId: `TRD${String(i + 1).padStart(6, "0")}`,
  client: `Client${(i % 100) + 1}`,
  symbol: ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"][i % 5],
  quantity: Math.floor(Math.random() * 100) + 1,
  price: Number((100 + Math.random() * 2400).toFixed(2)),
  timestamp: new Date(Date.now() - i * 1000).toISOString()
}));

app.get("/", (req, res) => {
  res.json({
    message: "Arham Fintech Trade Dashboard API is running!"
  });
});

app.get("/getTrades", (req, res) => {
  res.json({ count: trades.length, trades });
});

let pullInProgress = false;


app.get("/pullStatus", (req, res) => {
  res.json({
    status: pullInProgress ? "in_progress" : "idle",
  });
});


app.post("/startPull", (req, res) => {
  if (pullInProgress) {
    return res.status(409).json({
      message: "A trade pull is already in progress",
      status: "in_progress",
    });
  }

  pullInProgress = true;
  console.log("PULL STARTED");

  res.status(202).json({
    message: "Trade pull started in the background",
    status: "in_progress",
  });

  setTimeout(() => {
    console.log("TIMER FIRED");

    try {
      const newTrades = Array.from({ length: 100 }, (_, i) => ({
        tradeId: `NEW${Date.now()}${i}`,
        client: `Client${(i % 100) + 1}`,
        symbol: ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"][i % 5],
        quantity: Math.floor(Math.random() * 100) + 1,
        price: Number((100 + Math.random() * 2400).toFixed(2)),
        timestamp: new Date().toISOString(),
      }));

      trades.unshift(...newTrades);

      io.emit("tradesUpdated", {
        message: "New trades are available",
        count: newTrades.length,
      });

      console.log("PULL COMPLETED: added", newTrades.length);
    } catch (error) {
      console.error("PULL FAILED:", error);
    } finally {
      pullInProgress = false;
    }
  }, 5000);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
