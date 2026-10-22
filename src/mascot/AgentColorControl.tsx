import { useId } from "react";
import * as Popover from "@radix-ui/react-popover";
import { PaletteIcon } from "@phosphor-icons/react/dist/csr/Palette";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { Button } from "../system/Button";
import { ColorPicker } from "../system/ColorPicker";
import { Tooltip } from "../system/Tooltip";
import { useSystem } from "../system/useSystem";
import "./agent-color.css";

import { agentSwatches } from "./agent-swatches";

export function AgentColorControl({
  color,
  onChange,
  language,
}: {
  color: string;
  onChange: (color: string) => void;
  language: "ar" | "en";
}) {
  const { container } = useSystem();
  const ar = language === "ar",
    id = useId();
  const label = ar ? "لون المساعد" : "Agent color";
  return (
    <Popover.Root>
      <Tooltip
        content={label}
        trigger={
          <Popover.Trigger asChild>
            <Button
              iconOnly
              aria-label={label}
              variant="ghost"
              className="agent-color-trigger"
            >
              <PaletteIcon size={19} weight="duotone" aria-hidden />
            </Button>
          </Popover.Trigger>
        }
      />
      <Popover.Portal container={container}>
        <Popover.Content
          className="agent-color-popover"
          aria-labelledby={id}
          sideOffset={8}
          align="end"
          collisionPadding={16}
          dir={ar ? "rtl" : "ltr"}
        >
          <div className="agent-color-top">
            <h3 id={id}>{label}</h3>
            <Popover.Close asChild>
              <Button
                iconOnly
                variant="ghost"
                aria-label={ar ? "إغلاق" : "Close"}
              >
                <XIcon size={16} aria-hidden />
              </Button>
            </Popover.Close>
          </div>
          <ColorPicker
            label={ar ? "اختر لون الهوية" : "Choose an identity color"}
            value={color}
            onValueChange={onChange}
            swatches={agentSwatches(ar)}
            announcement="off"
          />
          <p>
            {ar
              ? "يظهر اللون على خيط ولوحة هذا المساعد."
              : "The color follows Khayt and this agent’s panel."}
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
