import { useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { ImageOff } from "lucide-react";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { useSystem } from "./useSystem";

export interface ImageResultLabels {
  loading?: string;
  error?: string;
  retry?: string;
}
export type ImageResultProps = Omit<
  ComponentPropsWithRef<"figure">,
  "children"
> & {
  /** Application-owned URL. The host owns resource trust, access and lifetime. */
  src?: string;
  alt: string;
  state?: "loading" | "loaded" | "error";
  aspectRatio?: "landscape" | "square" | "portrait";
  caption?: string;
  metadata?: string;
  onRetry?: () => void;
  action?: { label: string; onClick: () => void };
  labels?: ImageResultLabels;
};
/** Remount the resource state on URL/host-state changes, so stale load events cannot win. */
function ImageFrame({
  src,
  alt,
  state,
  onRetry,
  labels,
  caption,
  metadata,
  action,
}: Pick<
  ImageResultProps,
  "src" | "alt" | "state" | "onRetry" | "caption" | "metadata" | "action"
> & { labels: Required<ImageResultLabels> }) {
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false);
  const status =
    state === "error" || (state !== "loading" && (!src || failed))
      ? "error"
      : state === "loading" || !loaded
        ? "loading"
        : "loaded";
  return (
    <>
      <div
        className="tz-image-result-frame"
        data-state={status}
        aria-busy={status === "loading" || undefined}
      >
        {status === "loading" && (
          <>
            <Skeleton shape="rectangle" />
            <span className="tz-image-result-status" role="status">
              {labels.loading}
            </span>
          </>
        )}
        {status === "error" && (
          <div className="tz-image-result-status" role="status">
            <ImageOff aria-hidden="true" size={24} />
            <strong>{labels.error}</strong>
            <span dir="auto">{alt}</span>
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(event) => {
                  // Retry may immediately remove this button. Keep keyboard focus
                  // on the stable result rather than dropping it to the document.
                  event.currentTarget.closest("figure")?.focus();
                  onRetry();
                }}
              >
                {labels.retry}
              </Button>
            )}
          </div>
        )}
        {src && state !== "error" && !failed && (
          <img
            src={src}
            alt={alt}
            hidden={status !== "loaded"}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      {(caption || metadata || (action && status === "loaded")) && (
        <figcaption className="tz-image-result-caption">
          <div>
            {caption && <p dir="auto">{caption}</p>}
            {metadata && <small dir="auto">{metadata}</small>}
          </div>
          {action && status === "loaded" && (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </figcaption>
      )}
    </>
  );
}
export function ImageResult({
  src,
  alt,
  state = "loaded",
  aspectRatio = "landscape",
  caption,
  metadata,
  onRetry,
  action,
  labels,
  className = "",
  ...props
}: ImageResultProps) {
  const { config } = useSystem(),
    ar = config.direction === "rtl";
  const text = {
    loading: labels?.loading ?? (ar ? "جارٍ تحميل الصورة" : "Loading image"),
    error: labels?.error ?? (ar ? "الصورة غير متاحة" : "Image unavailable"),
    retry: labels?.retry ?? (ar ? "حاول مرة أخرى" : "Try again"),
  };
  return (
    <figure
      {...props}
      tabIndex={props.tabIndex ?? -1}
      className={`tz-image-result ${className}`}
      data-aspect={aspectRatio}
    >
      <ImageFrame
        key={`${src ?? ""}:${state}`}
        src={src}
        alt={alt}
        state={state}
        onRetry={onRetry}
        labels={text}
        caption={caption}
        metadata={metadata}
        action={action}
      />
    </figure>
  );
}
