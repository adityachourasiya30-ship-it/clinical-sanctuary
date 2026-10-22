import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = process.env.AUDIO_UPLOAD_DIR || 'uploads/audio';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `panic-audio-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/webm',
    'audio/ogg',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp4',
    'audio/aac',
    'audio/mpeg',
  ];

  if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type (${file.mimetype}). Only audio files are permitted.`));
  }
};

const maxSizeBytes = (parseInt(process.env.MAX_AUDIO_SIZE_MB, 10) || 25) * 1024 * 1024;

export const uploadAudio = multer({
  storage,
  limits: { fileSize: maxSizeBytes },
  fileFilter,
});
