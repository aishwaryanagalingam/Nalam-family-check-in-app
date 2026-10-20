import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nalamRouter from "./nalam";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nalamRouter);

export default router;
