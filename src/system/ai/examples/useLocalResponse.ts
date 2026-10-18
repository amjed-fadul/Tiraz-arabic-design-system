import {
  useCallback as useResponseCallback,
  useEffect as useResponseEffect,
  useRef as useResponseRef,
} from "react";
const localReplies = {
  ar: "ابدأ بتسميات قصيرة وواضحة، وامنح النص العربي ارتفاع سطر مريحًا. اضبط اتجاه الحقول على auto ليظهر النص المختلط مثل Tiraz بالترتيب الصحيح، ثم جرّب المسار كله بلوحة المفاتيح قبل الإطلاق.",
  en: 'Start with short, clear labels and give Arabic text a comfortable line height. Set inputs to dir="auto" so mixed text like طِراز reads in the right order, then walk the whole flow with the keyboard before launch.',
};
/** Example-only fixed reply streamed word by word, shared by the chat examples. No network or model. */
export function useLocalResponse(language: "ar" | "en") {
  const timer = useResponseRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    ),
    generation = useResponseRef(0),
    active = useResponseRef(false);
  const reply = localReplies[language];
  const cancel = useResponseCallback(() => {
    generation.current++;
    active.current = false;
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  useResponseEffect(() => cancel, [cancel]);
  const start = useResponseCallback(
    (onChunk: (text: string) => void, onComplete: () => void) => {
      if (active.current) return false;
      cancel();
      active.current = true;
      const run = generation.current,
        chunks = reply.match(/\S+\s*/gu) ?? [reply];
      let index = 0;
      function tick() {
        if (generation.current !== run) return;
        onChunk(chunks.slice(0, ++index).join(""));
        if (index === chunks.length) {
          active.current = false;
          timer.current = undefined;
          onComplete();
        } else timer.current = setTimeout(tick, 110);
      }
      timer.current = setTimeout(tick, 280);
      return true;
    },
    [cancel, reply],
  );
  return { start, cancel, active, reply };
}
