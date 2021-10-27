// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { WorkunitsService } from "@hpcc-js/comms";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  status: string;
  workunitId: string;
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

  if (req.method !== 'POST') {
    res.status(400).send({ status: 'failed', workunitId: '' })
    return
  }
  
  //console.log(req.body);


  const reqPayload = req.body;

  let wuService = new WorkunitsService({
    baseUrl: host + ":" + port,
    userID: userId,
    password: password,
  });

  let created = await wuService.WUCreate();
  let workunitId = created.Workunit.Wuid;
  let updated = await wuService.WUUpdate({
    QueryText: reqPayload.code,
    Wuid: workunitId,
    JobnameOrig: jobName,
  });

  let submmited = await wuService.WUSubmit({
    Wuid: workunitId,
    Cluster: cluster,
  });

  res.status(200).json({ status: "submitted", workunitId: workunitId});
}
