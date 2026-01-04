import express from 'express';
import  { resetPassword }  from './resetPassword.controller.js';
import protect from  "../middleware/authMiddleware.js";
import { attachVerifiedUser } from "../middleware/attachVerifiedUser.js";
const router = express.Router();

router.post('/reset-password', resetPassword, protect, attachVerifiedUser);

export default router;
