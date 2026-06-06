import express from 'express';
import { getDashboardSummary } from '../controllers/analyticsController.js';

const router = express.Router();

router.route('/summary').get(getDashboardSummary);

export default router;
