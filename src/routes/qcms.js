import { Router } from "express";
const router = Router();

import {
  createQcm,
  getAllQcms,
  getQcmById,
  getNextQuestion,
  submitResponse,
  getQcmResult,
  deleteQcm,
} from "../controllers/qcmController.js";

import { authenticate } from "../middlewares/auth.js";

router.use(authenticate);

router.post("/", createQcm);
router.get("/", getAllQcms);
router.get("/:id", getQcmById);
router.delete("/:id", deleteQcm);
router.get("/:id/question", getNextQuestion);
router.post("/:id/response", submitResponse);
router.get("/:id/result", getQcmResult);

export default router;
