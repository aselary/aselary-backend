import express from 'express';
import { verifyResetOTP } from './verifyResetOTP.controller.js';
import protect from  "../middleware/authMiddleware.js";
const router = express.Router();


router.post('/verify-reset-otp', verifyResetOTP, protect);

export default router;
