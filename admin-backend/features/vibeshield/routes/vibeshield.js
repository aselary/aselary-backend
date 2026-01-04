import express from 'express';
import { toggleVibeShield, getVibeShieldStatus } from '../controller/toggleVibeShield.js';
const router = express.Router();

router.patch('/toggle', toggleVibeShield);
router.get('/status', getVibeShieldStatus);

export default router;
