// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { WorkunitsService } from "@hpcc-js/comms";
import type { NextApiRequest, NextApiResponse } from "next";
import {parse} from 'papaparse'

type Data = {
  status: string;
  data: any;
};

function splitQuotes(line: string) {
  if(line.indexOf('"') < 0) 
    return line.split(',')

  let result = [], cell = '', quote = false;
  for(let i = 0; i < line.length; i++) {
    let char = line[i]
    if(char == '"' && line[i+1] == '"') {
      cell += char
      i++
    } else if(char == '"') {
      quote = !quote;
    } else if(!quote && char == ',') {
      result.push(cell)
      cell = ''
    } else {
      cell += char
    }
    if ( i == line.length-1 && cell) {
      result.push(cell)
    }
  }
  return result
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
    console.log('CSV File Read ' + reqPayload.logicalFile);

    //Format CSV
    let data = rResponse.Result.Row;

    //Assume that first row is column definitions
    let columns: string[] = computeTableColumns(data);
    console.log(columns);

    //Build the data json
    let rows: any[] = [];
    for (let i: number = 1; i < data.length; i++) {
      
      let row = null;
      try {  
        let row = splitQuotes((data[i].line));
        let colIndex = 0;
        let jsonRow = '{"_row_id_":' + i;
  
        row.forEach((value: any) => {
          jsonRow = jsonRow + ',"' + columns[colIndex] + '":"' + value + '"';
  
          colIndex++;
        });
        jsonRow = jsonRow + "}";
  
        //console.log(jsonRow);
        rows.push(JSON.parse(jsonRow));
     
      } catch (e) {
        let jsonRow = '{"_row_id_":' + i + ',"' + columns[0] + '":"'  + e + '"}';
        console.log(jsonRow);
        //rows.push(JSON.parse(jsonRow));
      }
    }
    //console.log(rows);
    res.status(200).json({ status: "completed", data: rows });

  }
}
