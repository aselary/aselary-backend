import express from 'express';
import { getStatus, toggleSeal, syncSettings } from './controller.js';
const router = express.Router();

router.get('/status', getStatus);
router.patch('/toggle', toggleSeal);
router.patch('/sync', syncSettings);

export default router;
