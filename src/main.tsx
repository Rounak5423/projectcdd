import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CivoraErrorBoundary } from "./components/common/CivoraErrorBoundary";
import "./index.css";

ReactDOM.createRoot(
    document.getElementById("root")!
).render(
    <React.StrictMode>
        <CivoraErrorBoundary>
            <App />
        </CivoraErrorBoundary>
    </React.StrictMode>
); 