import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/firebase"; // Initialize Firebase Analytics

createRoot(document.getElementById("root")!).render(<App />);
