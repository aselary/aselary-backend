import { Router } from 'express';
const router = Router();
import { getRevenueSummary, downloadRevenueCSV } from './controller.js';

router.get('/', getRevenueSummary);
router.get('/download', downloadRevenueCSV);

export default router;
