import Activity from '../models/Activity.js'; // create this model if not yet created

export const getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(5);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching activities' });
  }
};
