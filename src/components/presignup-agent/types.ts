export type Vendor = {
  name: string;
  estSpend: number;
  waste: number;
};

export type Product = {
  id: string;
  wasteTotal: number;
  vendors: Vendor[];
};

export type StepName = "finding" | "sizing" | "auditing";

export type AgentPhase =
  | { kind: "idle" }
  | { kind: "authenticating"; message: string }
  | { kind: "running"; step: StepName }
  | { kind: "scanning"; title: string; products: Product[] }
  | { kind: "complete"; products: Product[] }
  | { kind: "error"; message: string };

export type ScanItem = {
  key: string;
  matched: boolean;
  status: "pending" | "active" | "done";
  vendorText: string;
  amount: number;
  vendors: Vendor[];
};
