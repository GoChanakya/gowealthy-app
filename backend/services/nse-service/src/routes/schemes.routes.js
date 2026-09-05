import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import * as c from "../controllers/schemes.controller.js";

export const schemesRouter = Router();

schemesRouter.post("/schemes", asyncHandler("schemes", c.schemes));
schemesRouter.post("/master-download", asyncHandler("master-download", c.masterDownload));
