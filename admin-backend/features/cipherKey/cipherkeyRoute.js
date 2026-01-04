// backend/features/system-setting/cipherkeyRoute.js
import express from 'express';
import { getCipherKey, updateCipherKey } from './cipherkeyController.js';

const router = express.Router();

router.get('/', getCipherKey);
router.post('/', updateCipherKey);

export default router;
