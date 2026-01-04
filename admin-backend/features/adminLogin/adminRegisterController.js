import Admin from "../adminLogin/adminModel.js";
import bcrypt from "bcrypt";

export const registerAdmin = async (req, res) => {
  try {
    const { email, password, phone, username } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      email,
      password: hashedPassword,
      phone,
      username,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin", error: error.message });
  }
};
