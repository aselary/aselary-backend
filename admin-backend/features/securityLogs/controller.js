import SecurityLog from '../models/securityLog.js';


export const createSecurityLog = async (req, res) => {
  try {
    const { action, affectedUser, note } = req.body;

    const newLog = new SecurityLog({ action, affectedUser, note });
    await newLog.save();

    res.status(201).json({ message: 'Log created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log' });
  }
};

export const getAllSecurityLogs = async (req, res) => {
  try {
    const logs = await SecurityLog.find().sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};
