import { Router } from "express";
import { config } from "../config.js";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => res.send("NSE Node working"));

healthRouter.get("/api/nse/health", (req, res) =>
    res.json({
        ok: true,
        service: config.serviceName,
        environment: config.nseEnvironment,
        nseBaseUrl: config.nse.baseUrl,
        time: new Date().toISOString(),
    })
);
