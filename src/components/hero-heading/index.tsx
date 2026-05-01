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

export default function HeroHeading({ title, subtitle }: HeroHeadingProps) {
  return (
    <header className="rc-hero">
      <h1 className="rc-hero__title">{title}</h1>
      {subtitle && <p className="rc-hero__sub">{subtitle}</p>}
    </header>
  );
}
