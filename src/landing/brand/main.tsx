import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../system/tokens.css";
import "../../system/components.css";
import "./brand.css";
import { BrandPreview } from "./BrandPreview";
createRoot(document.getElementById("brand-root")!).render(<BrandPreview />);
