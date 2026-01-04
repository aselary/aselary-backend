import express from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../../config/cloudinary.js';

// If you protect your route with auth cookie/JWT, import it here
// import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Keep file in memory, then stream to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/upload',
  // requireAuth,               // <-- enable if you want only logged users
  upload.single('file'),       // the field NAME must be "file"
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'aselary_users',
            resource_type: 'image',
          },
          (err, uploadResult) => {
            if (err) return reject(err);
            resolve(uploadResult);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      return res.json({
        ok: true,
        url: result.secure_url || result.url,
        public_id: result.public_id,
      });
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return res.status(500).json({ error: err.message || 'Upload failed' });
    }
  }
);

export default router;