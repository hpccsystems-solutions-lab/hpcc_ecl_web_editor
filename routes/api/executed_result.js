// routes/api/executed_result.js
const express = require("express");
const { WorkunitsService } = require("@hpcc-js/comms");

const router = express.Router();

router.post("/executed_result", async (req, res) => {
  const host = process.env.HPCC_APP_URL;
  const port = process.env.HPCC_APP_PORT;
  const userId = process.env.HPCC_USER_ID;
  const password = process.env.HPCC_PASSWORD;
  const jobName = process.env.HPCC_EXECUTE_JOB_NAME;
  const cluster = process.env.HPCC_EXECUTE_CLUSTER_NAME || "";

  function handleChildRecords(row) {
    let jsonData = {};
    let count = 1;

    Object.keys(row).forEach((key) => {
      if (row[key].Row) {
        jsonData[key] = decorateRow(row[key].Row);
      } else {
        jsonData[key] = row[key];
      }
    });

    return jsonData;
  }

  function decorateRow(data) {
    let newData = [];

    if (data) {
      let count = 1;

      data.forEach((row) => {
        let newRow = { _row_id_: count++, ...row };
        let flatRow = handleChildRecords(newRow);
        newData.push({ ...flatRow });
      });
    }
    return newData;
  }

  const reqPayload = req.body;
  const workunitId = reqPayload.workunitId;

  let wuService = new WorkunitsService({
    baseUrl: `${host}:${port}`,
    userID: userId,
    password: password,
  });

  try {
    let qResponse = await wuService.WUQuery({ Wuid: workunitId });
    let wuState = qResponse.Workunits.ECLWorkunit[0].State;

    if (wuState === "completed") {
      let iResponse = await wuService.WUInfo({
        Wuid: workunitId,
        IncludeResults: true,
      });

      let outputs = [];
      let respOutputs = iResponse.Workunit.Results.ECLResult;

      for (let i = 0; i < respOutputs.length; i++) {
        let item = respOutputs[i];
        let rResponse = await wuService.WUResult({
          Wuid: workunitId,
          Sequence: item.Sequence,
          Start: 0,
          Count: 1050,
        });

        outputs.push({
          name: item.Name,
          columns: item.ECLSchemas ? item.ECLSchemas.ECLSchemaItem : [],
          data: decorateRow(rResponse.Result.Row),
        });
      }

      res.status(200).json({
        status: wuState,
        results: outputs,
        messages: [],
      });
    } else if (wuState === "failed") {
      let iResponse = await wuService.WUInfo({
        Wuid: workunitId,
        IncludeExceptions: true,
      });

      let messages = [];
      if (iResponse.Workunit.Exceptions && iResponse.Workunit.Exceptions.ECLException) {
        iResponse.Workunit.Exceptions.ECLException.forEach((item) => {
          messages.push({
            type: item.Severity,
            text: item.Message,
            line: item.LineNo,
            column: item.Column,
          });
        });
      }

      res.status(200).json({ status: wuState, results: [], messages: messages });
    } else {
      res.status(200).json({ status: wuState, results: [], messages: [] });
    }
  } catch (error) {
    console.error("Error in /api/executed_result:", error);
    res.status(500).json({ status: "error", results: [], messages: [] });
  }
});

module.exports = router;
