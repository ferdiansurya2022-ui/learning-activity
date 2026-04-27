import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gradeRouter from "./grade";
import aiStatusRouter from "./ai-status";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gradeRouter);
router.use(aiStatusRouter);

export default router;
