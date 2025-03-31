import React, { useState, useEffect } from "react";
import { Button, Layout, Table, Tabs, Row, Col, Tree, Collapse } from "antd";
import comms from "../utils/comms";
import CodeEditor from "./CodeEditor";
import "antd/dist/reset.css";
const { TabPane } = Tabs;
const { Header } = Layout;

function Home() {
  // Initial state (replacing props from getServerSideProps)
  const [code, setCode] = useState("");
  const [header, setHeader] = useState("");
  const [logicalFiles, setLogicalFiles] = useState([]);

  // Data from query result
  const [queryData, setQueryData] = useState([]);
  const [statusData, setStatusData] = useState([{ status: "", workunitId: "" }]);
  const [messages, setMessages] = useState([]);
  const [logicalFileData, setLogicalFileData] = useState([]);
  const [logicalFileDataColumns, setLogicalFileDataColumns] = useState([]);

  // Simulate getServerSideProps with client-side fetch on mount
  useEffect(() => {
    setCode("");
    setHeader("");
    setLogicalFiles([]);
    // Example fetch (uncomment and adjust when Express is ready):
    /*
    fetch('/api/initial-data', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setCode(data.code);
        setHeader(data.header);
        setLogicalFiles(data.logicalFiles);
      });
    */
  }, []);

  // Tree node selection
  async function treeNodeSelected(node) {
    console.log(node.key);
    if (node.isLeaf) {
      setStatusData([{ status: "", workunitId: "" }]);
      if (typeof node.key === "string") {
        let rResp = await comms.postAPIData("logical_file_result", {
          logicalFile: node.key,
        });

        if (rResp && rResp.status === "completed") {
          setLogicalFileDataColumns(computeTableColumns(rResp.data));
          setLogicalFileData(rResp.data);
        } else {
          setLogicalFileDataColumns([]);
          setLogicalFileData([]);
        }
      }
    }
  }

  // Process code execution
  async function submitClick() {
    setStatusData([{ status: "submitting" }]);
    setQueryData([]);
    setMessages([]);

    console.log("Start Submit - " + Date.now());
    let eResp = await comms.postAPIData("execute_ecl", {
      code: header + code,
    });

    setStatusData([eResp]);
    let workunitId = eResp.workunitId;

    let count = 0;
    while (workunitId && count < 100) {
      let rResp = await comms.postAPIData("executed_result", {
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

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function renderCell(value) {
    let isArray = Array.isArray(value?.Item);

    if (typeof value === "object") {
      if (isArray) {
        return String(value.Item);
      } else {
        return <Table rowKey="_row_id_" columns={computeTableColumns(value)} dataSource={value} pagination={false} size="small" />;
      }
    } else {
      return String(value);
    }
  }

  function computeTableColumns(data) {
    let columns = [];
    if (data?.length > 0) {
      Object.keys(data[0])?.forEach((key) => {
        if (key !== "_row_id_") {
          columns.push({
            title: key,
            dataIndex: key,
            key: key,
            render: (text) => <span>{renderCell(text)}</span>,
          });
        }
      });
    }
    return columns;
  }

  function plotMessages(messages) {
    if (messages.length > 0) {
      return (
        <Tabs>
          <TabPane tab="Errors" key="errors">
            <Table
              rowKey="line"
              columns={[
                { title: "Error", dataIndex: "type", key: "type" },
                { title: "Message", dataIndex: "text", key: "text" },
                { title: "Line", dataIndex: "line", key: "line" },
                { title: "Column", dataIndex: "column", key: "column" },
              ]}
              dataSource={messages}
            />
          </TabPane>
        </Tabs>
      );
    }
  }

  function plotOutput(queryData) {
    let panels = [];
    for (let i = 0; i < queryData.length; i++) {
      let item = queryData[i];
      panels.push(
        <TabPane tab={item.name} key={item.name}>
          <Table
            rowKey="_row_id_"
            columns={computeTableColumns(item.data)}
            dataSource={item.data}
            expandable={{
              expandedRowRender: (record) => <p style={{ margin: 0 }}>{record}</p>,
              rowExpandable: (record) => record.length,
            }}
          />
        </TabPane>
      );
    }
    return <Tabs>{panels}</Tabs>;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header>
        <div style={{ fontSize: 18, color: "white" }}>HPCC Systems - ECL Web Editor</div>
      </Header>
      <Layout style={{ padding: 30 }}>
        <Tabs>
          <TabPane tab="ECL" key="ECL">
            <Collapse defaultActiveKey={["2"]} bordered={false}>
              <Collapse.Panel header="" key="1">
                <CodeEditor value={header} />
              </Collapse.Panel>
              <Collapse.Panel header="" key="2" collapsible="disabled">
                <CodeEditor value={code} onChange={(e) => setCode(e)} />
              </Collapse.Panel>
            </Collapse>
            <Row style={{ paddingBottom: 5, paddingTop: 5 }}>
              <Col span={4}>
                <Button type="primary" onClick={submitClick}>
                  Submit
                </Button>
              </Col>
              <Col span={8}>
                <span style={{ fontSize: 16, color: "blueviolet" }}>{statusData[0].status}</span>
              </Col>
            </Row>
            {plotMessages(messages)}
            {plotOutput(queryData)}
          </TabPane>
          <TabPane tab="LOGICAL FILES" key="Logical Files">
            <Layout style={{ height: 800 }}>
              <Layout.Sider width={400} style={{ background: "white", overflow: "scroll" }}>
                <Tree
                  autoExpandParent
                  key="logicalFiles"
                  defaultExpandParent
                  defaultExpandAll
                  showLine
                  treeData={logicalFiles}
                  onSelect={(keys, e) => treeNodeSelected(e.node)}
                />
              </Layout.Sider>
              <Layout style={{ overflow: "scroll", background: "white", height: 800 }}>
                <Table columns={logicalFileDataColumns} dataSource={logicalFileData} />
              </Layout>
            </Layout>
          </TabPane>
        </Tabs>
      </Layout>
    </Layout>
  );
}

// Utility functions (moved from bottom of original file)
function toFileName(fileWithScope) {
  let words = fileWithScope.split("::");
  return words[words.length - 1];
}

function toScopeName(fileWithScope) {
  let words = fileWithScope.split("::");
  words.pop();
  console.log(words.join("::"));
  return words.join("::");
}

// eslint-disable-next-line no-unused-vars
function createTreeData(data) {
  if (data) {
    let map = new Map();
    data.forEach((item) => {
      let scopeName = toScopeName(item);
      let fileName = toFileName(item);
      let qualifiedName = item;
      if (map.has(scopeName)) {
        map.get(scopeName).push({ key: qualifiedName, isLeaf: true, title: fileName });
      } else {
        let node = [];
        node.push({ key: qualifiedName, isLeaf: true, title: fileName });
        map.set(scopeName, node);
      }
    });
    let treeData = [];
    map.forEach((value, key) => {
      treeData.push({ key: key, isLeaf: false, title: key, children: value });
    });
    return treeData;
  } else {
    return [];
  }
}

export default Home;
