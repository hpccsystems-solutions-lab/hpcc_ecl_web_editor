// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

// Load API routes
app.use("/api", require("./routes/api/execute_ecl"));
app.use("/api", require("./routes/api/executed_result"));
app.use("/api", require("./routes/api/logical_file_result"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
