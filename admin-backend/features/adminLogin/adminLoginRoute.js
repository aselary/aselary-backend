// /admin login/route/adminLoginRoute.js
import express from "express";
import { adminLogin } from "../adminLogin/adminLoginController.js";
import { registerAdmin } from "../adminLogin/adminRegisterController.js";
import  verifyAdminToken  from '../middlewares/verifyAdminToken.js';
const router = express.Router();

// POST /api/admin/login
router.post("/login", adminLogin);
router.post("/register", registerAdmin); // 👈 new route

router.get('/admin-dashboard', verifyAdminToken, (req, res) => {
  res.json({
    message: 'Access granted to admin dashboard',
    admin: req.admin, // from token
  });
});

export default router;
