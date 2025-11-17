const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Example API
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

// Start server
app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});