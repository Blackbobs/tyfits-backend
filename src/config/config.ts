import dotenv from 'dotenv';

dotenv.config();

interface Config {
  PORT: number;
  nodeEnv: string;
  secretKey: string;
  MONGO_URI: string;
  refreshKey: string;
  clodinaryCloudName: string;
  clodinaryApiKey: string;
  clodinaryApiSecret: string;
}

const config: Config = {
  PORT: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  secretKey: process.env.JWT_SECRET_KEY  as string,
  MONGO_URI: process.env.MONGO_URI!,
  refreshKey: process.env.REFRESH_TOKEN_SECRET_KEY as string,
  clodinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  clodinaryApiKey: process.env.CLOUDINARY_API_KEY as string,
  clodinaryApiSecret: process.env.CLOUDINARY_API_SECRET as string,
};

export default config;