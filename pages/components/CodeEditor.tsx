import React, { Component } from "react";

import { ECLEditorComponent } from "./ECLCodeEditor";

// if (typeof navigator !== 'undefined') {
//   require('codemirror/mode/ecl/ecl');
// }

const CodeEditor = (props: any) => {
  return (
    <div style={{ width: "100%" }}>
      <ECLEditorComponent
        text={props.value ? props.value.toString() : ""}
        width={800}
        height={400}
        onChange={props.onChange}
      ></ECLEditorComponent>
    </div>
  );
};
export default CodeEditor;
