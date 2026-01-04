import AetherSeal from '../models/aetherseal.js';

export const getStatus = async (req, res) => {
  try {
    let doc = await AetherSeal.findOne();
    if (!doc) doc = new AetherSeal();
    res.json({ seal: doc.seal, sync: doc.sync });
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const toggleSeal = async (req, res) => {
  try {
    let doc = await AetherSeal.findOne();
    if (!doc) doc = new AetherSeal();

    doc.seal = !doc.seal;
    doc.updatedAt = new Date();
    await doc.save();

    res.json({ seal: doc.seal });
  } catch (err) {
    res.status(500).json({ error: 'Toggle failed' });
  }
};

export const syncSettings = async (req, res) => {
  try {
    let doc = await AetherSeal.findOne();
    if (!doc) doc = new AetherSeal();

    doc.sync = true;
    doc.updatedAt = new Date();
    await doc.save();

    res.json({ sync: doc.sync });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed' });
  }
};
