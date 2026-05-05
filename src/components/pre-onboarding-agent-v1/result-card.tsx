import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Product } from "./types";
import { specForKey } from "./products";
import { idToKey, vendorIcon, USD } from "./agent-api";

type ResultCardProps = {
  product: Product;
};

function useAnimatedNumber(target: number, duration: number): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = now - start;
      const p = duration > 0 ? Math.min(1, t / duration) : 1;
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      setValue(v);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function ResultCard({ product }: ResultCardProps) {
  const key = idToKey(product.id);
  const spec = specForKey(key);
  const [revealing, setRevealing] = useState(true);
  const [pulse, setPulse] = useState(false);
  const amount = useAnimatedNumber(product.wasteTotal || 0, 900);

  useEffect(() => {
    const t1 = setTimeout(() => setRevealing(false), 700);
    const t2 = setTimeout(() => setPulse(true), 900);
    const t3 = setTimeout(() => setPulse(false), 900 + 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <article
      className={clsx("rc-poav1-card", revealing && "is-revealing")}
      data-key={key}
    >
      <div className="rc-poav1-card-head">
        <div className="rc-poav1-card-name">
          <span className="rc-poav1-emoji">{spec.emoji}</span>
          {spec.name}
        </div>
        <div className="rc-poav1-card-badge">Completed</div>
      </div>
      <div className="rc-poav1-card-hero">
        <div className={clsx("rc-poav1-card-amount", pulse && "is-pulse")}>
          {USD.format(amount)}
        </div>
        <p className="rc-poav1-card-desc">{spec.desc}</p>
      </div>
      <div className="rc-poav1-card-vendors">
        {(product.vendors || []).map((v, i) => {
          const icon = vendorIcon(v.name);
          return (
            <div key={`${v.name}-${i}`} className="rc-poav1-card-vendor">
              <div className="rc-poav1-card-vendor-name">
                {icon && (
                  <img
                    className="rc-poav1-card-vendor-logo"
                    src={icon}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                {v.name}
              </div>
              <div className="rc-poav1-card-vendor-fig">
                <span className="rc-poav1-card-vendor-spend">
                  {USD.format(v.estSpend || 0)} spend
                </span>
                <span className="rc-poav1-card-vendor-waste">
                  {USD.format(v.waste || 0)} wasted
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
