
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [message, setMessage] = useState("Connecting to server...");

  useEffect(() => {
    // Connect to the backend for automatic updates.
    const socket = io(API_URL);

    socket.on("connect", () => {
      setMessage("Connected to live trade updates");
    });

    socket.on("tradesUpdated", () => {
      fetchTrades();
      setPulling(false);
      setMessage("New trades received automatically");
    });

    // Load existing trades immediately.
    fetchTrades();

    return () => socket.disconnect();
  }, []);

  async function fetchTrades() {
    try {
      const response = await fetch(`${API_URL}/getTrades`);
      const data = await response.json();
      setTrades(data.trades);
    } catch (error) {
      setMessage("Unable to connect to the backend");
    } finally {
      setLoading(false);
    }
  }

  async function startPull() {
    try {
      setPulling(true);
      setMessage("Starting background trade pull...");

      const response = await fetch(`${API_URL}/startPull`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not start pull");
      }

      setMessage(data.message);
    } catch (error) {
      setPulling(false);
      setMessage(error.message);
    }
  }

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">ARHAM FINTECH</p>
          <h1>Trades Dashboard</h1>
          <p className="subtitle">
            Monitor exchange trade data in real time.
          </p>
        </div>

        <button onClick={startPull} disabled={pulling}>
          {pulling ? "Pull in progress..." : "Start Trade Pull"}
        </button>
      </header>

      <section className="stats">
        <div className="stat-card">
          <span>Total Trades</span>
          <strong>{trades.length.toLocaleString()}</strong>
        </div>

        <div className="stat-card">
          <span>Connection</span>
          <strong className="connection">
            {loading ? "Loading..." : "Live"}
          </strong>
        </div>

        <div className="stat-card">
          <span>Pull Status</span>
          <strong>{pulling ? "In Progress" : "Idle"}</strong>
        </div>
      </section>

      <p className="status">{message}</p>

      <section className="table-card">
        <div className="table-heading">
          <h2>Trade Records</h2>
          <span>{trades.length.toLocaleString()} records</span>
        </div>

        {loading ? (
          <p className="empty">Loading existing trades...</p>
        ) : trades.length === 0 ? (
          <p className="empty">No trades available.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Trade ID</th>
                  <th>Client</th>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Price (₹)</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 100).map((trade) => (
                  <tr key={trade.tradeId}>
                    <td>{trade.tradeId}</td>
                    <td>{trade.client}</td>
                    <td><span className="symbol">{trade.symbol}</span></td>
                    <td>{trade.quantity}</td>
                    <td>{trade.price.toLocaleString("en-IN")}</td>
                    <td>
                      {new Date(trade.timestamp).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="footnote">
          Showing up to 100 records. All available trades are counted above.
        </p>
      </section>
    </main>
  );
}

export default App;
