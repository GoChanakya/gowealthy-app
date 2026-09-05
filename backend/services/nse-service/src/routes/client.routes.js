import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import * as c from "../controllers/client.controller.js";

export const clientRouter = Router();

clientRouter.post("/ucc-register", asyncHandler("ucc-register", c.uccRegister));
clientRouter.post("/ucc-modify", asyncHandler("ucc-modify", c.uccModify));
clientRouter.post("/fatca-upload", asyncHandler("fatca-upload", c.fatcaUpload));
clientRouter.post("/client-auth-status", asyncHandler("client-auth-status", c.clientAuthStatus));
