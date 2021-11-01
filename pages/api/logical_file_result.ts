// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { WorkunitsService } from "@hpcc-js/comms";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  status: string;
  data: any;
};

function CSVtoArray(text: string) {
  var re_valid =
    /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
  var re_value =
    /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
  // Return NULL if input string is not well formed CSV string.
  if (!re_valid.test(text)) return [];
  var a = []; // Initialize array to receive values.
  text.replace(
    re_value, // "Walk" the string using replace with callback.
    function (m0, m1, m2, m3) {
      // Remove backslash from \' in single quoted values.
      if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
      // Remove backslash from \" in double quoted values.
      else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
      else if (m3 !== undefined) a.push(m3);
      return ""; // Return empty string.
    }
  );
  // Handle special case of empty last value.
  if (/,\s*$/.test(text)) a.push("");
  return a;
}

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

function computeTableColumns(data: any) {
  let columns: any[] = [];
  if (data.length > 0) {
    //Use the first row to construct the columns
    columns = data[0].line.split(",");
  }
  return columns;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const host = process.env.HPCC_APP_URL;
  const port = process.env.HPCC_APP_PORT;
  const userId = process.env.HPCC_USER_ID;
  const password = process.env.HPCC_PASSWORD;
  const jobName = process.env.HPCC_EXECUTE_JOB_NAME;
  const cluster = process.env.HPCC_EXECUTE_CLUSTER_NAME
    ? process.env.HPCC_EXECUTE_CLUSTER_NAME
    : "";

  if (req.method !== "POST") {
    res.status(400).send({ status: "failed", data: [] });
    return;
  }

  const reqPayload = req.body;

  let fileType = "flat";
  if (reqPayload.logicalFile.toUpperCase().includes(".CSV")) {
    fileType = "csv";
  }
  let wuService = new WorkunitsService({
    baseUrl: host + ":" + port,
    userID: userId,
    password: password,
  });

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
    //Format CSV
    let data = rResponse.Result.Row;

    //Assume that first row is column definitions
    let columns: string[] = computeTableColumns(data);
    //console.log(columns);

    //Build the data json
    let rows: any[] = [];
    for (let i: number = 1; i < data.length; i++) {
      //   let row = data[i].line.split(",");
      let row = CSVtoArray(data[i].line);

      let colIndex = 0;
      let jsonRow = '{"_row_id_":' + i;

      row.forEach((value: string) => {
        jsonRow = jsonRow + ',"' + columns[colIndex] + '":"' + value + '"';

        colIndex++;
      });
      jsonRow = jsonRow + "}";

      console.log(jsonRow);
      rows.push(JSON.parse(jsonRow));
    }
    //console.log(rows);
    res.status(200).json({ status: "completed", data: rows });

  }
}
