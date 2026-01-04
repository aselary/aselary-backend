import express from 'express';
import getSterlingBalance from './controller.js';

const router = express.Router();

router.get('/', getSterlingBalance);

export default router;
