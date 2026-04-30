import { useState } from "react";
import clsx from "clsx";
import type { ComponentMeta } from "../../registry";
import "./hello.css";

type HelloProps = {
  name?: string;
  muted?: boolean;
};

export const meta: ComponentMeta<HelloProps> = {
  description: "Sanity-check component used to verify the bundle pipeline.",
  variants: {
    default: {},
    named: { name: "Aung" },
    muted: { name: "muted state", muted: true },
  },
};

export default function Hello({ name = "world", muted = false }: HelloProps) {
  const [count, setCount] = useState(0);
  return (
    <div className={clsx("rc-hello", muted && "rc-hello--muted")}>
      <h2 className="rc-hello__title">Hello, {name}!</h2>
      <button
        className="rc-hello__btn"
        onClick={() => setCount((c) => c + 1)}
        type="button"
      >
        clicked {count} {count === 1 ? "time" : "times"}
      </button>
    </div>
  );
}
