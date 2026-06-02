import { Router } from "express";
const router = Router();
import { createQcm, getAllQcms, getQcmById, getNextQuestion, submitResponse, getQcmResult } from "../controllers/qcmController";
import { authenticate } from "../middlewares/auth";

router.use(authenticate);

router.post("/", createQcm);
router.get("/", getAllQcms);
router.get("/:id", getQcmById);
router.get("/:id/question", getNextQuestion);
router.post("/:id/response", submitResponse);
router.get("/:id/result", getQcmResult);

export default router;
