import type { CompanyVendor } from "./types";
import { USD, compactUsd, vendorIcon } from "../presignup-agent/agent-api";

const CATEGORY_LABEL: Record<CompanyVendor["category"], string> = {
  ad_id: "Ad",
  token_id: "AI",
  vendor_id: "Vendor",
};

const ANNUALIZE = 12;

type VendorListProps = {
  vendors: CompanyVendor[];
};

export default function VendorList({ vendors }: VendorListProps) {
  if (!vendors.length) return null;
  return (
    <ul className="rc-md__vendors">
      {vendors.map((v, i) => {
        const icon = vendorIcon(v.name);
        const annualSpend = v.spend * ANNUALIZE;
        const annualWaste = v.waste * ANNUALIZE;
        return (
          <li className="rc-md__vendor" key={`${v.name}-${i}`}>
            <div className="rc-md__vendor-name">
              {icon ? (
                <img
                  className="rc-md__vendor-logo"
                  src={icon}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              <span>{v.name}</span>
              <span className="rc-md__vendor-tag">{CATEGORY_LABEL[v.category]}</span>
            </div>
            <div className="rc-md__vendor-fig">
              <span className="rc-md__vendor-spend">{compactUsd(annualSpend)} spend</span>
              <span className="rc-md__vendor-waste">{USD.format(annualWaste)} wasted</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
