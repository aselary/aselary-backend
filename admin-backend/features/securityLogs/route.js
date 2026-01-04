import express from 'express';
import { createSecurityLog, getAllSecurityLogs } from './controller.js';

const router = express.Router();

router.post('/create', createSecurityLog);
router.get('/all', getAllSecurityLogs);

export default router;
