import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import * as c from "../controllers/orders.controller.js";

export const ordersRouter = Router();

ordersRouter.post("/order-entry", asyncHandler("order-entry", c.orderEntry));
ordersRouter.post("/purchase-payment", asyncHandler("purchase-payment", c.purchasePayment));
ordersRouter.post("/upi-payment-status", asyncHandler("upi-payment-status", c.upiPaymentStatus));
ordersRouter.post("/order-cancel", asyncHandler("order-cancel", c.orderCancel));
ordersRouter.post("/order-status", asyncHandler("order-status", c.orderStatus));
