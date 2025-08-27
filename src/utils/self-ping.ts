import cron from 'node-cron';
import axios from 'axios';

const YOUR_SERVER_URL = 'https://tyfits-backend.onrender.com'; 

cron.schedule('*/14 * * * *', async () => {
  try {
    console.log('⏰ Pinging server to keep alive...');
    await axios.get(YOUR_SERVER_URL);
    console.log('✅ Ping successful');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Ping failed:', error.message);
    } else {
      console.error('❌ Ping failed with unknown error:', error);
    }
  }
});
