import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreGitHubPagesPath } from "./lib/github-pages.ts";

restoreGitHubPagesPath();

createRoot(document.getElementById("root")!).render(<App />);
