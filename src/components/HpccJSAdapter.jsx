// src/components/HpccJSAdapter.js
import React, { useCallback, useEffect } from "react";
import { SizeMe } from "react-sizeme";

function useId(prefix = "hpcc-js") {
  const id = `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
  return id;
}

// function useConst(callback) {
//   const ref = useRef(null);
//   if (!ref.current) {
//     ref.current = callback();
//   }
//   return ref.current;
// }

function HpccJSComponent({ widget, width, height, debounce = true }) {
  const divID = useId();

  const setDivRef = useCallback(
    (node) => {
      widget?.target(node);
      if (node) {
        widget?.render();
      }
      return () => {
        widget?.target(null);
      };
    },
    [widget]
  );

  useEffect(() => {
    if (widget?.target()) {
      widget?.resize({ width, height });
      if (debounce) {
        widget?.lazyRender();
      } else {
        widget?.render();
      }
    }
  }, [debounce, height, widget, width]);

  return isNaN(width) || isNaN(height) || width === 0 || height === 0 ? (
    <></>
  ) : (
    <div ref={setDivRef} id={divID} className="hpcc-js-component" style={{ width, height }} />
  );
}

function AutosizeHpccJSComponent({ widget, fixedHeight = "100%", padding = 0, debounce = true, hidden = false, children }) {
  return (
    <SizeMe monitorHeight>
      {({ size }) => {
        const width = size?.width || padding * 2;
        const height = size?.height || padding * 2;
        return (
          <div
            style={{
              width: "100%",
              height: hidden ? "1px" : fixedHeight,
              position: "relative",
            }}>
            <div
              style={{
                position: "absolute",
                padding: `${padding}px`,
                display: hidden ? "none" : "block",
              }}>
              <HpccJSComponent widget={widget} debounce={debounce} width={width - padding * 2} height={height - padding * 2} />
            </div>
            {children ? (
              <div
                style={{
                  position: "absolute",
                  padding: `${padding}px`,
                  display: hidden ? "none" : "block",
                }}>
                {children}
              </div>
            ) : (
              <></>
            )}
          </div>
        );
      }}
    </SizeMe>
  );
}

export { HpccJSComponent, AutosizeHpccJSComponent };
export default HpccJSComponent;
