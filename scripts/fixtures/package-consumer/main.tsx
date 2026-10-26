import { createRoot } from "react-dom/client";
import { Example } from "./Example";

createRoot(document.getElementById("root")!).render(
  <main>
    <Example arabic />
    <Example arabic={false} />
  </main>,
);
