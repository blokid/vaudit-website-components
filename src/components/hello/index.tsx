import { useState } from "react";
import "./hello.css";

type HelloProps = {
  name?: string;
};

export default function Hello({ name = "world" }: HelloProps) {
  const [count, setCount] = useState(0);
  return (
    <div className="rc-hello">
      <h2 className="rc-hello__title">Hello, {name}!</h2>
      <button className="rc-hello__btn" onClick={() => setCount((c) => c + 1)}>
        clicked {count} {count === 1 ? "time" : "times"}
      </button>
    </div>
  );
}
