// routes/api/execute_ecl.js
const express = require("express");
const { WorkunitsService } = require("@hpcc-js/comms");

const router = express.Router();

router.post("/execute_ecl", async (req, res) => {
  const host = process.env.HPCC_APP_URL;
  const port = process.env.HPCC_APP_PORT;
  const userId = process.env.HPCC_USER_ID;
  const password = process.env.HPCC_PASSWORD;
  const jobName = process.env.HPCC_EXECUTE_JOB_NAME;
  const cluster = process.env.HPCC_EXECUTE_CLUSTER_NAME || "";

  if (req.method !== "POST") {
    return res.status(400).json({ status: "failed", workunitId: "" });
  }

  const reqPayload = req.body;

  let wuService = new WorkunitsService({
    baseUrl: `${host}:${port}`,
    userID: userId,
    password: password,
  });

  try {
    let created = await wuService.WUCreate();
    let workunitId = created.Workunit.Wuid;
    let updated = await wuService.WUUpdate({
      QueryText: reqPayload.code,
      Wuid: workunitId,
      JobnameOrig: jobName,
    });
    let submitted = await wuService.WUSubmit({
      Wuid: workunitId,
      Cluster: cluster,
    });

    res.status(200).json({ status: "submitted", workunitId: workunitId });
  } catch (error) {
    console.error("Error in /api/execute_ecl:", error);
    res.status(500).json({ status: "failed", workunitId: "" });
  }
});

module.exports = router;
