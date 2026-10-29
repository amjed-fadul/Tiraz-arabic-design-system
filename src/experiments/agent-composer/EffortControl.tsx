import { EffortChoice } from "../../system/ai/examples/agent-workspace/EffortChoice";

export function EffortControl({
  value,
  onChange,
  ar,
}: {
  value: number;
  onChange: (value: number) => void;
  ar: boolean;
}) {
  return (
    <EffortChoice
      value={value}
      onChange={onChange}
      language={ar ? "ar" : "en"}
    />
  );
}
