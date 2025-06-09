import dotenv from 'dotenv';

dotenv.config();

interface Config {
  PORT: number;
  nodeEnv: string;
  secretKey: string;
  MONGO_URI: string;
  refreshKey: string
}

const config: Config = {
  PORT: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  secretKey: process.env.JWT_SECRET_KEY  as string,
  MONGO_URI: process.env.MONGO_URI!,
  refreshKey: process.env.REFRESH_TOKEN_SECRET_KEY as string
};

export default config;