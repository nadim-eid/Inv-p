import ExcelJS from "exceljs";
import { getAllProducts } from "../db/store.js";
import { getAllMovements } from "../db/store.js";

const INVENTAIRE_COLUMNS = [
  { header: "ID", key: "id", width: 16 },
  { header: "Nom", key: "nom", width: 22 },
  { header: "Tare_g", key: "tare_g", width: 10 },
  { header: "MasseInitiale_g", key: "masseInitiale_g", width: 16 },
  { header: "MasseRestante_g", key: "masseRestante_g", width: 16 },
  { header: "PoidsBrutActuel_g", key: "poidsBrutActuel_g", width: 18 },
  { header: "Emplacement", key: "emplacement", width: 16 },
  { header: "DateEntree", key: "dateEntree", width: 13 },
  { header: "QRValue", key: "qrValue", width: 16 },
  { header: "DerniereModification", key: "derniereModification", width: 22 },
];

const MOUVEMENTS_COLUMNS = [
  { header: "MovementID", key: "movementId", width: 18 },
  { header: "DateHeure", key: "dateHeure", width: 22 },
  { header: "ProductID", key: "productId", width: 16 },
  { header: "NomProduit", key: "nomProduit", width: 20 },
  { header: "Type", key: "type", width: 12 },
  { header: "Quantite_g", key: "quantite_g", width: 12 },
  { header: "StockAvant_g", key: "stockAvant_g", width: 14 },
  { header: "StockApres_g", key: "stockApres_g", width: 14 },
  { header: "Utilisateur", key: "utilisateur", width: 24 },
];

const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16232E" } };
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial" };

function styleSheet(sheet, columns) {
  sheet.columns = columns;
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + columns.length)}1` };
}

/**
 * Genere un classeur Excel a jour, avec la meme structure de tables que
 * la version documentee (feuilles Inventaire / Mouvements), a partir des
 * donnees actuellement stockees localement. Retourne un Buffer pret a
 * etre envoye en telechargement.
 */
export async function generateExcelExport() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Chemical Stock Manager";
  workbook.created = new Date();

  const invSheet = workbook.addWorksheet("Inventaire");
  styleSheet(invSheet, INVENTAIRE_COLUMNS);
  for (const p of getAllProducts()) {
    invSheet.addRow(p);
  }

  const mvtSheet = workbook.addWorksheet("Mouvements");
  styleSheet(mvtSheet, MOUVEMENTS_COLUMNS);
  const movements = [...getAllMovements()].sort(
    (a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime()
  );
  for (const m of movements) {
    mvtSheet.addRow(m);
  }

  return workbook.xlsx.writeBuffer();
}
