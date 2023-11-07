import React, { Component } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/ext-language_tools";

// if (typeof navigator !== 'undefined') {
//   require('codemirror/mode/ecl/ecl');
// }

const CodeEditor = (props: any) => (
  <div style={{ width: "100%" }}>
    <AceEditor
      mode="javascript"
      {...props}
      width="100%"
      height="800px"
      fontSize="1rem"
      defaultValue={props.value}
      showPrintMargin={false}
      onChange={props.onChange}
      setOptions={{
        highlightActiveLine: true,
      }}
    />
  </div>
);

export default CodeEditor;
