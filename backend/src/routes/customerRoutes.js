import express from 'express';
import { getCustomers, getCustomerProfile } from '../controllers/customerController.js';

const router = express.Router();

router.route('/').get(getCustomers);
router.route('/:id').get(getCustomerProfile);

export default router;
