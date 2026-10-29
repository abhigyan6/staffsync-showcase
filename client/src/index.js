/*
 * Copyright (c) 2026 Abhigyan Dwivedi.
 * StaffSync — limited local evaluation only. See LICENSE and NOTICE.md.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./store";
import App from "./App";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "./App.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(
      Provider,
      { store },
      React.createElement(BrowserRouter, null, React.createElement(App)),
    ),
  ),
);
