import { useEffect, useState } from "react";
import clsx from "clsx";
import type { ComponentMeta } from "../../registry";
import { assetUrl } from "../../asset-base";
import "./adid-animation.css";

const DEFAULT_FRAMES = ["assets/adid/frame-0.svg"];

const DEFAULT_NOTIF_TEXTS = [
  "Recover 3-7% of your Ad budget",
  "Prevent overcharges before you're billed",
  "Reclaim the cost of invalid traffic",
];

const DEFAULT_INTERVAL_MS = 3000;
const FADE_MS = 200;

type AdidAnimationProps = {
  /**
   * URLs for the dashboard frame layers. The first entry is shown as the
   * active frame; additional entries are loaded but stacked beneath it
   * (matches the original markup which preloads three layouts). Relative
   * paths resolve against this bundle's CDN base, so passing
   * `["assets/adid/frame-0.svg"]` works without specifying a host.
   */
  frames?: string[];
  /** Cycling notification banner copy. Each entry: 3 orange words + the rest white. */
  notifications?: string[];
  /** Cycle interval in milliseconds. Defaults to 3000. */
  intervalMs?: number;
};

export const meta: ComponentMeta<AdidAnimationProps> = {
  description:
    "AdID hero animation — pulsing scan grid with cycling notification banner.",
  props: {
    frames: {
      type: "string[]",
      description:
        "Frame image URLs. Relative paths resolve against the bundle's CDN base.",
      default: '["assets/adid/frame-0.svg"]',
    },
    notifications: {
      type: "string[]",
      description:
        "Banner copy lines. First three words render orange, the rest white.",
      default: "see source",
    },
    intervalMs: {
      type: "number",
      description: "Cycle interval in milliseconds.",
      default: "3000",
    },
  },
  variants: {
    "default": {},
  },
};

export default function AdidAnimation({
  frames = DEFAULT_FRAMES,
  notifications = DEFAULT_NOTIF_TEXTS,
  intervalMs = DEFAULT_INTERVAL_MS,
}: AdidAnimationProps) {
  const [notifIdx, setNotifIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (notifications.length <= 1) return;
    const interval = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setNotifIdx((i) => (i + 1) % notifications.length);
        setFading(false);
      }, FADE_MS);
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [notifications, intervalMs]);

  const currentText = notifications[notifIdx] ?? "";
  const words = currentText.split(" ");
  const orange = words.slice(0, 3).join(" ");
  const white = words.slice(3).join(" ");

  return (
    <div className="rc-adid">
      {frames.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={clsx(
            "rc-adid__frame",
            i === 0 && "rc-adid__frame--active",
          )}
        >
          <img src={assetUrl(src)} alt="" />
        </div>
      ))}

      <div className="rc-adid__vignette" />
      <div className="rc-adid__corner-glow" />

      <div className="rc-adid__col-flash" />
      <div className="rc-adid__col-flash" />
      <div className="rc-adid__col-flash" />
      <div className="rc-adid__col-flash" />
      <div className="rc-adid__col-flash" />
      <div className="rc-adid__col-flash" />
      <div className="rc-adid__col-flash" />
      <div className="rc-adid__col-flash" />

      <div className="rc-adid__pulse-rings">
        <div className="rc-adid__pulse-ring" />
        <div className="rc-adid__pulse-ring" />
        <div className="rc-adid__pulse-ring" />
      </div>

      <div className="rc-adid__scan-line" />

      <div className="rc-adid__sweep">
        <div className="rc-adid__sweep-bar" />
      </div>

      <div className="rc-adid__scanlines" />

      <div className="rc-adid__notif">
        <span
          className={clsx(
            "rc-adid__notif-text",
            fading && "rc-adid__notif-text--fade",
          )}
        >
          <span className="rc-adid__notif-orange">{orange}</span>
          {white && <span className="rc-adid__notif-white"> {white}</span>}
        </span>
      </div>
    </div>
  );
}
