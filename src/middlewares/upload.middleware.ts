
import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.diskStorage({});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'));
  }
};

const upload = multer({ storage, fileFilter });


export const uploadProductAssets = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);
