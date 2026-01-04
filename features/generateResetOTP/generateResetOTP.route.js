import express from 'express';
import { generateResetOTP }  from './generateResetOTP.controller.js';
import protect from  "../middleware/authMiddleware.js";
const router = express.Router();

router.post('/generate-reset-otp', generateResetOTP, protect);

export default router;
