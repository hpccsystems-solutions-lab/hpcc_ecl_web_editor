import type { NextApiRequest, NextApiResponse } from "next";
import { WorkunitsService } from "@hpcc-js/comms";

type Data = {
  status: string;
  results: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    const host = process.env.HPCC_APP_URL;
    const port = process.env.HPCC_APP_PORT;
    const userId = process.env.HPCC_USER_ID;
    const password = process.env.HPCC_PASSWORD;
    const jobName = process.env.HPCC_EXECUTE_JOB_NAME;
    const cluster = process.env.HPCC_EXECUTE_CLUSTER_NAME? process.env.HPCC_EXECUTE_CLUSTER_NAME: '' ;

  function decorateRowId(data: any[]) {
    let newData: any[] = [];

    if (data) {
      let count = 1;
      data.forEach((row) => {
        let newRow = { _row_id_: count++, ...row };
        newData.push(newRow);
      });
    }
    return newData;
  }



  const reqPayload = req.body;
  const workunitId = reqPayload.workunitId;

  let wuService = new WorkunitsService({
    baseUrl: host + ":" + port,
    userID: userId,
    password: password,
  });
  let qResponse = await wuService.WUQuery({ Wuid: workunitId });
  let wuState = qResponse.Workunits.ECLWorkunit[0].State;
  if (wuState == "completed") {
    let iResponse = await wuService.WUInfo({
      Wuid: workunitId,
      IncludeResults: true,
    });

    let outputs = [];

    //console.log(JSON.stringify(iResponse));

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
        data: decorateRowId(rResponse.Result.Row),
      });
    }
    respOutputs.forEach((item: any) => {});

    res.status(200).json({
      status: wuState,
      results: outputs,
    });
  } else {
    res.status(200).json({ status: wuState, results: [] });
  }
}
