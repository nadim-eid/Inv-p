import React from "react";
import { getStockLevel } from "../utils/stockLevel.js";

export { getStockLevel };

const LABELS = {
  vert: "Stock normal",
  orange: "Stock faible",
  rouge: "Stock presque vide",
  inconnu: "Stock inconnu",
};

export default function StockBadge({ masseRestante_g, seuilFaible, seuilCritique }) {
  const level = getStockLevel(masseRestante_g, seuilFaible, seuilCritique);
  return (
    <span className={`stock-badge ${level}`}>
      <span className="stock-dot" />
      {LABELS[level]}
    </span>
  );
}
