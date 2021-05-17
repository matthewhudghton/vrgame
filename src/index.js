import { StrictMode } from "react";
import ReactDOM from "react-dom";

import Vr from "./Vr";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <Vr></Vr>
  </StrictMode>,
  rootElement
);
