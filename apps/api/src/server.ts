import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/db.js';
import { User } from './models/index.js';
import { runSeed } from './scripts/seed.js';

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to Database (MongoDB or In-Memory fallback)
    await connectDatabase();

    // 2. Auto-seed if database is unpopulated
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Nexora API] 📦 Database is empty. Running initial enterprise auto-seed...');
      await runSeed();
    }

    // 3. Create and start Express server
    const app = createApp();

    app.listen(config.port, () => {
      console.log(`[Nexora API] 🚀 Server running on http://localhost:${config.port}${config.apiPrefix}`);
      console.log(`[Nexora API] 🩺 Health check: http://localhost:${config.port}${config.apiPrefix}/health`);
      console.log(`[Nexora API] 🏢 Organizations: http://localhost:${config.port}${config.apiPrefix}/organizations`);
      console.log(`[Nexora API] 🛡️ Approvals: http://localhost:${config.port}${config.apiPrefix}/approvals`);
      console.log(`[Nexora API] 🌐 Accounts: http://localhost:${config.port}${config.apiPrefix}/accounts`);
      console.log(`[Nexora API] 🎫 Tickets: http://localhost:${config.port}${config.apiPrefix}/tickets`);
      console.log(`[Nexora API] 🧾 Invoices: http://localhost:${config.port}${config.apiPrefix}/invoices`);
      console.log(`[Nexora API] 🔌 Mock ERP: http://localhost:${config.port}${config.apiPrefix}/mock-erp/partners`);
    });
  } catch (err: any) {
    console.error('[Nexora API] 🔴 Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
