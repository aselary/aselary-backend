// signin.routes.js
import express from 'express';
import  signin  from './signin.controller.js';
import protect from  "../middleware/authMiddleware.js";
const router = express.Router();

router.post('/signin', signin, protect);

export default router;
