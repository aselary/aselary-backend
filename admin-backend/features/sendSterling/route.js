import express from 'express';
import sendSterlingMoney from './controller.js';

const router = express.Router();

router.post('/', sendSterlingMoney);

export default router;
