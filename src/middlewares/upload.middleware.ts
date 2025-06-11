import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.diskStorage({});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname);
  if (['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'));
  }
};

const upload = multer({ storage, fileFilter });

export const uploadImages = upload.array('images', 5); // For normal products
export const uploadFile = upload.single('file');       // For digital products
