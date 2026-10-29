// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const { readFile } = require("node:fs/promises");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

// Load API routes
app.use("/api", require("./routes/api/execute_ecl"));
app.use("/api", require("./routes/api/executed_result"));
app.use("/api", require("./routes/api/logical_file_result"));

app.post("/", express.urlencoded({ extended: false }), async (req, res, next) => {
  const { code = "", header = "", files = "" } = req.body || {};
  if ([code, header, files].some((value) => typeof value !== "string")) {
    return res.status(400).json({ message: "code, header and files must be strings." });
  }

  try {
    const html = await readFile(path.join(__dirname, "dist", "index.html"), "utf8");
    // Escaping '<' prevents posted text from closing the JSON script element.
    const initialData = JSON.stringify({ code, header, files }).replace(/</g, "\\u003c");
    res.set("Cache-Control", "no-store");
    res.type("html").send(html.replace(
      "</head>",
      `<script id="editor-initial-data" type="application/json">${initialData}</script></head>`,
    ));
  } catch (error) {
    next(error);
  }
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
