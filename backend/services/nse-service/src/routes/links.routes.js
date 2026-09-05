import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import * as c from "../controllers/links.controller.js";

export const linksRouter = Router();

linksRouter.post("/get-link", asyncHandler("get-link", c.getLink));
linksRouter.post("/resend-comm", asyncHandler("resend-comm", c.resendComm));
