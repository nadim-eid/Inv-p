import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { generateExcelExport } from "../services/exportService.js";

export const exportRouter = Router();

exportRouter.use(requireAuth);

// GET /api/export/excel -> telecharge un instantane .xlsx des donnees actuelles
exportRouter.get("/excel", async (req, res, next) => {
  try {
    const buffer = await generateExcelExport();
    const filename = `Inventaire_Chimique_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});
