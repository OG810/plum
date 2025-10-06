// src/routes/textRoutes.js
import express from "express"
const router = express.Router();
import { getText} from "../controller/textHandle.js"

// GET /api/text
router.get("/text", getText);

export default router
