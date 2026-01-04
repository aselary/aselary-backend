import express from 'express';
import {
  createLogic,
  updateLogic,
 getLogics,
  toggleLogic,
  deleteLogic,
  editLogic
} from './vibesController.js';

const router = express.Router();
router.patch('/edit/:id', editLogic);
router.patch('/toggle/:id', toggleLogic);
router.post('/', createLogic);
router.get('/', getLogics);
router.put('/:id', updateLogic);
router.delete('/:id', deleteLogic);

export default router;