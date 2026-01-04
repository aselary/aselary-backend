import express from 'express';
import {
  createObscuraLogic,
  updateObscuraLogic,
 getObscuraLogics,
  toggleLogic,
  deleteLogic,
  editLogic
} from './logicController.js';

const router = express.Router();
router.patch('/edit/:id', editLogic);
router.patch('/toggle/:id', toggleLogic);
router.post('/', createObscuraLogic);
router.get('/', getObscuraLogics);
router.put('/:id', updateObscuraLogic);
router.delete('/:id', deleteLogic);

export default router;

