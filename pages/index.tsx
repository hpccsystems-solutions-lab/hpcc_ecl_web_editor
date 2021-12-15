import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import styles from "../styles/Home.module.css";
import { GetServerSideProps } from "next";
import getRawBody from "raw-body";
import { Button, Layout, Table, Tabs, Row, Col, Tree } from "antd";
import { Key } from "antd/es/table/interface";
import { ReactChild, ReactFragment, ReactPortal, useState } from "react";
import { Comms } from "../utils/Comms";
import { IncomingForm } from "formidable";
import { EventDataNode } from "antd/lib/tree";

const CodeEditor = dynamic(import("./components/CodeEditor"), { ssr: false });
const { TabPane } = Tabs;
const { Header } = Layout;

interface Props {
  code: string;
  logicalFiles: any[];
}

const Home: NextPage<Props> = (props) => {
  //Data from the query result
  const [queryData, setQueryData] = useState<any>([]);

  //Status of the query submission
  const [statusData, setStatusData] = useState<any>([
    { status: "", workunitId: "" },
  ]);

  const [messages, setMessages] = useState<any[]>([]);

  //Code
  const [code, setCode] = useState<string>(props.code);

  //Logical File Data
  const [logicalFileData, setLogicalFileData] = useState<any>([]);
  const [logicalFileDataColumns, setLogicalFileDataColumns] = useState<any>([]);

  //Tree Node Selected to populate logical file contents
  async function treeNodeSelected(node: EventDataNode) {
    console.log(node.key);
    if (node.isLeaf) {
      setStatusData([{ status: "", workunitId: "" }]);
      if (typeof node.key === "string") {
        let rResp = await Comms.postAPIData("logical_file_result", {
          logicalFile: node.key,
        });

        if (rResp && rResp.status === "completed") {
          setLogicalFileDataColumns(computeTableColumns(rResp.data));
          setLogicalFileData(rResp.data);
          return;
        } else {
          setLogicalFileDataColumns("");
          setLogicalFileData("");
        }
      }
    }
  }

  //Process Code Execution
  async function submitClick() {
    setStatusData([{ status: "submitting" }]);
    setQueryData([]);
    setMessages([]);

    console.log("Start Submit - " + Date.now());
    //console.log("code - " + code);

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
      if (rResp) {
        if (rResp.status === "completed") {
          setStatusData([{ status: rResp.status, workunitId: workunitId }]);
          setQueryData(rResp.results);
          console.log("End Submit - " + Date.now());
          return;
        } else if (rResp.status === "failed") {
          setStatusData([{ status: rResp.status, workunitId: workunitId }]);
          setMessages(rResp.messages);

          return;
        } else {
          count++;
          setStatusData([{ status: rResp.status, workunitId: workunitId }]);
          await sleep(1000);
        }
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
          columns.push({ title: key, dataIndex: key, key: key, render: (text: any) => <span>{String(text)}</span> });
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

  //Error messages or warning messages
  function plotMessages(messages: any[]) {
    if (messages.length > 0) {
      return (
        <Tabs>
          <TabPane tab={"Errors"} key={"errors"}>
            <Table
              rowKey={"line"}
              columns={[
                { title: "Error", dataIndex: "type", key: "type" },
                { title: "Message", dataIndex: "text", key: "text" },
                { title: "Line", dataIndex: "line", key: "line"},
                { title: "Column", dataIndex: "column", key: "column"}
              ]}
              dataSource={messages}
            />
          </TabPane>
        </Tabs>
      );
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
          HPCC Systems - ECL Web Editor
        </div>
      </Header>
      <Layout style={{ padding: 30 }}>
        <Tabs>
          <TabPane tab={"ECL"} key={"ECL"}>
            <CodeEditor
              value={props.code}
              onChange={(editor: any, data: any, value: string) =>
                setCode(value)
              }
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
            {plotMessages(messages)}
            {plotOutput(queryData)}
          </TabPane>
          <TabPane tab={"LOGICAL FILES"} key={"Logical Files"}>
            <Layout style={{ height: 800 }}>
              <Layout.Sider
                width={400}
                style={{ background: "white", overflow: "scroll" }}
              >
                <Tree
                  autoExpandParent
                  key={"logicalFiles"}
                  defaultExpandParent
                  defaultExpandAll
                  showLine
                  treeData={props.logicalFiles}
                  onSelect={(keys: Key[], e) => treeNodeSelected(e.node)}
                />
              </Layout.Sider>
              <Layout
                style={{ overflow: "scroll", background: "white", height: 800 }}
              >
                <Table
                  columns={logicalFileDataColumns}
                  dataSource={logicalFileData}
                />
              </Layout>
            </Layout>
          </TabPane>
        </Tabs>
      </Layout>
    </Layout>
  );
};

function toFileName(fileWithScope: string): string {
  let words = fileWithScope.split("::");
  return words[words.length - 1];
}

function toScopeName(fileWithScope: string): string {
  let words = fileWithScope.split("::");
  words.pop();
  console.log(words.join("::"));
  return words.join("::");
}

//Populate files list
function createTreeData(data: string[]) {
  if (data) {
    let map = new Map();
    data.forEach((item: string) => {
      let scopeName = toScopeName(item);
      let fileName = toFileName(item);
      let qualifiedName = item;
      if (map.has(scopeName)) {
        map
          .get(scopeName)
          .push({ key: qualifiedName, isLeaf: true, title: fileName });
      } else {
        let node = [];
        node.push({ key: qualifiedName, isLeaf: true, title: fileName });
        map.set(scopeName, node);
      }
    });
    let treeData: any = [];
    map.forEach((value, key) => {
      treeData.push({ key: key, isLeaf: false, title: key, children: value });
    });
    return treeData;
  } else {
    return [];
  }
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  let code: any = "";
  let treeData: any[] = [];
  let logicalFiles: string[] = [];
  if (context.req.method == "POST") {
    const data = await new Promise((resolve, reject) => {
      const form = new IncomingForm();

      form.parse(context.req, (err, fields, files) => {
        if (!err) {
          console.log("fields = " + JSON.stringify(fields));
          code = fields.code;
          let fileNames: any = fields.files;
          if (fileNames && fileNames.length > 0) {
            let fileNamesList: string[] = fileNames.split(",");
            fileNamesList.forEach((element) => {
              console.log(element);
              logicalFiles.push(element);
            });

            treeData = createTreeData(logicalFiles);
          }
        }
        resolve({ err, fields, files });
      });
    });
  }
  return {
    props: {
      code: code,
      logicalFiles: treeData,
    },
  };
};

export default Home;
