/* eslint-disable react-hooks/exhaustive-deps */
// src/components/ECLCodeEditor.js
import React, { useEffect, useState } from "react";
import { HpccJSComponent, AutosizeHpccJSComponent } from "./HpccJSAdapter";

function ECLEditorComponent({ text = "", width, height, readonly = false, onChange = () => {} }) {
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    import("@hpcc-js/codemirror").then(({ ECLEditor }) => {
      const editor = new ECLEditor().on("changes", () => {
        onChange(editor.text());
      });
      setEditor(editor);
    });
  }, []);

  useEffect(() => {
    if (editor) {
      if (editor.text() !== text) {
        editor.text(text);
      }
      editor.readOnly(readonly).lazyRender();
    }
  }, [editor, text, readonly]);

  return <HpccJSComponent widget={editor} width={width} height={height} />;
}

function AutosizeECLEditorComponent({ text = "", readonly = false, onChange = () => {} }) {
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    import("@hpcc-js/codemirror").then(({ ECLEditor }) => {
      const editor = new ECLEditor().on("changes", () => {
        onChange(editor.text());
      });
      setEditor(editor);
    });
  }, []);

  useEffect(() => {
    if (editor) {
      if (editor.text() !== text) {
        editor.text(text);
      }
      editor.readOnly(readonly).lazyRender();
    }
  }, [editor, text, readonly]);

  return <AutosizeHpccJSComponent widget={editor} padding={4} />;
}

export { ECLEditorComponent, AutosizeECLEditorComponent };
export default ECLEditorComponent;
