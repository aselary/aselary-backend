import express from 'express';
import { createLogic, getAllLogics, toggleLogic } from './smart-logicController.js';
import { deleteLogic } from './deleteLogic.controller.js';
import updateLogic from './update-logic.js'; // ✅ IMPORT THIS
const router = express.Router();
router.delete('/:id', deleteLogic);
router.post('/', createLogic);
router.get('/', getAllLogics);
router.patch('/toggle/:id', toggleLogic);
router.put('/update-logic/:id', updateLogic); // ✅ ADD THIS LINE

export default router;


