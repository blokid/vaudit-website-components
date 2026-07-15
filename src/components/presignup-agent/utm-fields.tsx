import type { CSSProperties } from "react";

const UTM_NAMES = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

/**
 * Hidden UTM inputs. The site's campaign-tracking script injects the values;
 * we read them at submit time (see readUtms in agent-api.ts) and forward to
 * the backend. Kept in one place so both forms stay identical.
 *
 * The hide is an INLINE style, not a CSS class, on purpose: the inputs are
 * created by this JS, so tying the hide to the same JS means they can never
 * render visible because a separate (cached/stale/unloaded) stylesheet didn't
 * apply. Standard visually-hidden recipe — off-screen, clipped, unfocusable.
 */
const HIDDEN: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

export default function UtmFields() {
  return (
    <div style={HIDDEN} aria-hidden="true">
      {UTM_NAMES.map((name) => (
        <input
          key={name}
          type="text"
          name={name}
          tabIndex={-1}
          autoComplete="off"
          style={HIDDEN}
        />
      ))}
    </div>
  );
}
