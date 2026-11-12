import type { FoundationId } from "../site-routes";
import { ArabicRtlPage } from "./ArabicRtlPage";
import { ColorsPage } from "./ColorsPage";
import type { FoundationPageProps } from "./FoundationPage";
import { GetStartedPage } from "./GetStartedPage";
import { ShapePage } from "./ShapePage";
import { SpacingPage } from "./SpacingPage";
import { TypographyPage } from "./TypographyPage";

const pages: Record<
  FoundationId,
  (props: FoundationPageProps) => React.JSX.Element
> = {
  "get-started": GetStartedPage,
  colors: ColorsPage,
  typography: TypographyPage,
  spacing: SpacingPage,
  shape: ShapePage,
  "arabic-rtl": ArabicRtlPage,
};

export function FoundationRoute({
  id,
  ...props
}: FoundationPageProps & { id: FoundationId }) {
  const Page = pages[id];
  return <Page {...props} />;
}
