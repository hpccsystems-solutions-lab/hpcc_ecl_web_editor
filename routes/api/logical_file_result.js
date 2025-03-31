// routes/api/logical_file_result.js
const express = require("express");
const { WorkunitsService } = require("@hpcc-js/comms");

const router = express.Router();

function splitQuotes(line) {
  if (line.indexOf('"') < 0) return line.split(",");

  let result = [];
  let cell = "";
  let quote = false;
  for (let i = 0; i < line.length; i++) {
    let char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      cell += char;
      i++;
    } else if (char === '"') {
      quote = !quote;
    } else if (!quote && char === ",") {
      result.push(cell);
      cell = "";
    } else {
      cell += char;
    }
    if (i === line.length - 1 && cell) {
      result.push(cell);
    }
  }
  return result;
}

function decorateRowId(data) {
  let newData = [];

  if (data) {
    let count = 1;
    data.forEach((row) => {
      let newRow = { _row_id_: count++, ...row };
      newData.push(newRow);
    });
  }
  return newData;
}

function computeTableColumns(data) {
  let columns = [];
  if (data.length > 0) {
    columns = data[0].line.split(",");
  }
  return columns;
}

router.post("/logical_file_result", async (req, res) => {
  const host = process.env.HPCC_APP_URL;
  const port = process.env.HPCC_APP_PORT;
  const userId = process.env.HPCC_USER_ID;
  const password = process.env.HPCC_PASSWORD;
  const jobName = process.env.HPCC_EXECUTE_JOB_NAME;
  const cluster = process.env.HPCC_EXECUTE_CLUSTER_NAME || "";

  if (req.method !== "POST") {
    return res.status(400).json({ status: "failed", data: [] });
  }

  const reqPayload = req.body;

  let fileType = "flat";
  if (reqPayload.logicalFile.toUpperCase().includes(".CSV")) {
    fileType = "csv";
  }

  let wuService = new WorkunitsService({
    baseUrl: `${host}:${port}`,
    userID: userId,
    password: password,
  });

  try {
    let rResponse = await wuService.WUResult({
      LogicalName: reqPayload.logicalFile,
      Cluster: cluster,
      Count: 1050,
      Sequence: 0,
      Start: 0,
    });

    if (fileType !== "csv") {
      res.status(200).json({
        status: "completed",
        data: decorateRowId(rResponse.Result.Row),
      });
    } else {
      console.log("CSV File Read " + reqPayload.logicalFile);

      let parsedResult = JSON.parse(rResponse.Result);
      let data = parsedResult.Row;

      let columns = computeTableColumns(data);
      console.log(columns);

      let rows = [];
      for (let i = 1; i < data.length; i++) {
        try {
          let row = splitQuotes(data[i].line);
          let colIndex = 0;
          let jsonRow = `{"_row_id_":${i}`;

          row.forEach((value) => {
            jsonRow += `,"${columns[colIndex]}":"${value}"`;
            colIndex++;
          });
          jsonRow += "}";

          rows.push(JSON.parse(jsonRow));
        } catch (e) {
          let jsonRow = `{"_row_id_":${i},"${columns[0]}":"${e}"}`;
          console.log(jsonRow);
          // rows.push(JSON.parse(jsonRow)); // Commented out as in original
        }
      }

      res.status(200).json({ status: "completed", data: rows });
    }
  } catch (error) {
    console.error("Error in /api/logical_file_result:", error);
    res.status(500).json({ status: "failed", data: [] });
  }
});

module.exports = router;
