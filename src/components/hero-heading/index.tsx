import { useLayoutEffect, useRef } from "react";
import type { ComponentMeta } from "../../registry";
import "./hero-heading.css";

type HeroHeadingProps = {
  /** Required headline. Honors `\n` for forced line breaks. */
  title: string;
  /** Supporting line beneath the title. Honors `\n`. */
  subtitle?: string;
};

export const meta: ComponentMeta<HeroHeadingProps> = {
  description:
    "Page-hero title + subtitle pair. Drop above any agent / chips / cards markers to render the hero copy without round-tripping through Webflow Designer.",
  props: {
    title: {
      type: "string",
      description: "Headline. Use `\\n` to break lines.",
      required: true,
    },
    subtitle: {
      type: "string",
      description: "Supporting line. Use `\\n` to break lines.",
      default: "none",
    },
  },
  variants: {
    "VendorID": {
      title: "Connect. Verify.\nUncover Recoverable Value.",
      subtitle:
        "One system to verify billing across ads, AI, SaaS, cloud, payments, shipping, and operational vendors. Find discrepancies, contract leakage, and recoverable value before it becomes accepted cost.",
    },
    "AdID": {
      title: "Connect. Verify. Recover.",
      subtitle:
        "See what Vaudit can recover across your ad spend before billing discrepancies become accepted cost.",
    },
    "TokenID": {
      title: "Connect. Verify. Recover.",
      subtitle:
        "See what Vaudit can recover across your AI spend before billing discrepancies become accepted cost.",
    },
  },
};

// Module-level "first wins" guard. If a Webflow page accidentally ships two
// data-rc="hero-heading" markers (e.g. a stale duplicate that survived a
// Designer edit), the second mount hides its own marker so the visitor only
// sees one hero block.
let HERO_RENDERED = false;

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

export default function HeroHeading({ title, subtitle }: HeroHeadingProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const headerEl = ref.current;
    if (!headerEl) return;
    const marker = headerEl.parentElement; // the [data-rc="hero-heading"] div
    if (!marker) return;

    if (HERO_RENDERED) {
      // Another hero-heading already mounted on this page. Hide this marker
      // so the page only shows one hero block.
      (marker as HTMLElement).style.display = "none";
      return;
    }
    HERO_RENDERED = true;

    // Hide any leftover static hero copy in the same Webflow section. We
    // only target ancestor sections / direct siblings whose text matches our
    // title or subtitle exactly (after whitespace normalization), so we don't
    // accidentally hide nav links or footers that happen to share words.
    const titleNorm = normalize(title);
    const subtitleNorm = subtitle ? normalize(subtitle) : null;

    let scope: HTMLElement | null = marker.parentElement;
    // Walk up at most three levels — enough for `<section><div><div data-rc>…`
    // but not so far that we sweep the whole page.
    for (let depth = 0; depth < 3 && scope; depth += 1) {
      for (const child of Array.from(scope.children)) {
        if (child === marker || marker.contains(child) || child.contains(marker)) continue;
        if (child.querySelector("[data-rc]")) continue; // don't touch other components
        const txt = normalize(child.textContent ?? "");
        if (!txt) continue;
        if (txt === titleNorm || (subtitleNorm && txt === subtitleNorm)) {
          (child as HTMLElement).style.display = "none";
        }
      }
      scope = scope.parentElement;
    }

    return () => {
      // Allow re-mounting (e.g. window.VauditComponents.mount() rerun) to
      // pass the guard cleanly if this marker is being torn down.
      HERO_RENDERED = false;
    };
  }, [title, subtitle]);

  return (
    <header className="rc-hero" ref={ref}>
      <h1 className="rc-hero__title">{title}</h1>
      {subtitle && <p className="rc-hero__sub">{subtitle}</p>}
    </header>
  );
}
