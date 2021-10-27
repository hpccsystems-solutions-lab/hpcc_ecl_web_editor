import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import styles from "../styles/Home.module.css";
import { GetServerSideProps } from "next";
import getRawBody from "raw-body";
import { Button, Layout, Table, Tabs, Row, Col } from "antd";
import { useState } from "react";
import {Comms} from "../utils/Comms";

const CodeEditor = dynamic(import("./components/CodeEditor"), { ssr: false });
const { TabPane } = Tabs;
const { Header } = Layout;

interface Props {
  code: string;
}

const Home: NextPage<Props> = (props) => {
  //Data from the query result
  const [queryData, setQueryData] = useState<any>([]);
  const [queryDataColumns, setQueryDataColumns] = useState<any>([]);

  //Status of the query submission
  const [statusData, setStatusData] = useState<any>([
    { status: "", workunitId: "" },
  ]);

  //Code
  const [code, setCode] = useState<string>(props.code);

  //Process Code Execution
  async function submitClick() {
    setStatusData([{ status: "submitting" }]);
    setQueryData([]);
    console.log("query columns: " + queryDataColumns);
    console.log("Start Submit - " + Date.now());
    console.log("code - " + code);

    let eResp = await Comms.postAPIData("execute_ecl", {
      code: code,
    });

    setStatusData([eResp]);
    let workunitId = eResp.workunitId;

    let count = 0;
    while (workunitId && count < 100) {
      let rResp = await Comms.postAPIData("executed_result", {
        workunitId: workunitId,
      });

      console.log("workunit " + workunitId + " Status = " + rResp.status);

      if (rResp && rResp.status === "completed") {
        setStatusData([{ status: rResp.status, workunitId: workunitId }]);
        setQueryData(rResp.results);
        console.log("End Submit - " + Date.now());
        return;
      } else {
        count++;
        setStatusData([{ status: rResp.status, workunitId: workunitId }]);
        await sleep(1000);
      }
    }
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //UI Metadata
  function computeTableColumns(data: any) {
    let columns: any[] = [];
    if (data.length > 0) {
      //Use the first row to construct the columns
      Object.keys(data[0]).forEach((key) => {
        if ("_row_id_" !== key)
          //ignore the decorated column used to produce a unique row key
          columns.push({ title: key, dataIndex: key, key: key });
      });
    }
    return columns;
  }

  //Use the results data to compute the column metadata
  function toColumnList(str: string, col: any) {
    if (str && str.length > 0) {
      return str + "," + col.key;
    } else {
      return col.key;
    }
  }

  //The Results can contain multiple outputs so plan to create tabs and a table for each
  function plotOutput(queryData: any) {
    let panels = [];
    for (let i = 0; i < queryData.length; i++) {
      let item = queryData[i];
      panels.push(
        <TabPane tab={item.name} key={item.name}>
          <Table
            rowKey={"_row_id_"}
            columns={computeTableColumns(item.data)}
            dataSource={item.data}
          />
        </TabPane>
      );
    }

    return <Tabs>{panels}</Tabs>;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header>
        <div style={{ fontSize: 18, color: "white" }}>
          HPCC Systems - Simple ECL Editor
        </div>
      </Header>
      <Layout style={{ padding: 30 }}>
        <div style={{ fontSize: 18, paddingBottom: 10 }}>ECL</div>
      
        <CodeEditor
          value={props.code}
          onChange={(editor: any, data: any, value: string) => setCode(value)}
        />
      
        <Row style={{ paddingBottom: 5, paddingTop: 5 }}>
          <Col span={4}>
            <Button type="primary" onClick={() => submitClick()}>
              Submit
            </Button>
          </Col>
          <Col span={8}>
            <span style={{ fontSize: 16, color: "blueviolet" }}>
              {statusData[0].status}
            </span>
          </Col>
        </Row>

        {plotOutput(queryData)}
      </Layout>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  let code = "";
  if (context.req.method == "POST") {
    const body = await getRawBody(context.req);
    code = decodeURIComponent(body.toString().replace(/\+/g, " ")).split(
      "code="
    )[1];
  }
  return {
    props: {
      code: code,
    },
  };
};

export default Home;
