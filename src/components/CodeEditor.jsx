// src/components/CodeEditor.js
import React from "react";
import { ECLEditorComponent } from "./ECLCodeEditor";

function CodeEditor(props) {
  return (
    <div style={{ width: "100%" }}>
      <ECLEditorComponent text={props.value ? props.value.toString() : ""} width={800} height={400} onChange={props.onChange} />
    </div>
  );
}

export default CodeEditor;
