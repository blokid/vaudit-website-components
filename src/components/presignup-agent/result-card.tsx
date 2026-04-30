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
    <article className={clsx("pa-card", revealing && "revealing")} data-key={key}>
      <div className="card-preview-viz">{spec.viz}</div>
      <div className="preview-head">
        <div className="preview-title">
          <span className="emoji">{spec.emoji}</span>
          {spec.name}
        </div>
      </div>
      <p className="preview-desc">{spec.longDesc || spec.desc}</p>

      <div className="card-head">
        <div className="card-name">
          <span className="emoji">{spec.emoji}</span>
          {spec.name}
        </div>
        <div className="card-badge">Completed</div>
      </div>
      <div className="card-hero">
        <div className={clsx("card-amount", pulse && "pulse")}>
          {USD.format(amount)}
        </div>
        <p className="card-desc">{spec.desc}</p>
      </div>
      <div className="card-vendors">
        {(product.vendors || []).map((v, i) => {
          const icon = vendorIcon(v.name);
          return (
            <div key={`${v.name}-${i}`} className="card-vendor">
              <div className="card-vendor-name">
                {icon && (
                  <img
                    className="card-vendor-logo"
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
              <div className="card-vendor-fig">
                <span className="card-vendor-spend">
                  {USD.format(v.estSpend || 0)} spend
                </span>
                <span className="card-vendor-waste">
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
