// src/routes/textRoutes.js
import express from "express"
const router = express.Router();
import { getText} from "../controller/textHandle.js"
import { getImage} from "../controller/imageHandle.js"
import multer from "multer"
const upload = multer({dest:"uploads/"});
// GET /api/text

router.get("/text", getText);
router.post("/image",upload.single("image"),getImage);

export default router