import React, { Component } from 'react'
import {UnControlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'

if (typeof navigator !== 'undefined') {
  require('codemirror/mode/ecl/ecl');
}

const CodeEditor = (props: any) => (
  <div style={{width:'100%'}}>
    <CodeMirror
      {...props}
      value={props.value}
      options={{lineNumbers: true, mode: 'ecl'}}
    />
  </div>
)

export default CodeEditor;