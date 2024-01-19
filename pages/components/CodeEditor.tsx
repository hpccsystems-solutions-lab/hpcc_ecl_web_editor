import React, { Component } from "react";
import AceEditor from "react-ace";
import { ECLEditorComponent } from "./ECLCodeEditor";

// if (typeof navigator !== 'undefined') {
//   require('codemirror/mode/ecl/ecl');
// }

const CodeEditor = (props: any) => {
  return (
    <div style={{ width: "1600" }}>
      <ECLEditorComponent
        text={props.value ? props.value.toString() : ""}
        width={1600}
        height={400}
        onChange={props.onChange}
      ></ECLEditorComponent>
      {/* <AceEditor
        mode="sql"
        width="100%"
        height="800px"
        fontSize="1rem"
        defaultValue={props.value ? props.value.toString() : ""}
        showPrintMargin={false}
        onChange={props.onChange}
        setOptions={{
          highlightActiveLine: true,
        }}
      /> */}
    </div>
  );
};
export default CodeEditor;
