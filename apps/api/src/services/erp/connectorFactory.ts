import { IErpConnector, ErpConnectionConfig } from './types.js';
import { OdooConnector } from './odooConnector.js';
import { MockConnector } from './mockConnector.js';
import { ErpProvider } from '@nexora/core';

export class ErpConnectorFactory {
  public static createConnector(config: ErpConnectionConfig): IErpConnector {
    switch (config.provider) {
      case ErpProvider.ODOO:
        return new OdooConnector(config);
      case ErpProvider.MOCK:
      default:
        return new MockConnector();
    }
  }

  public static getFromEnv(): IErpConnector {
    const isMock = process.env.MOCK_ERP_ENABLED === 'true' || !process.env.ODOO_HOST;
    if (isMock) {
      return new MockConnector();
    }

    return new OdooConnector({
      provider: ErpProvider.ODOO,
      host: process.env.ODOO_HOST || 'https://demo.odoo.com',
      db: process.env.ODOO_DB || 'odoo_db',
      username: process.env.ODOO_USERNAME || 'admin',
      password: process.env.ODOO_PASSWORD || 'admin',
    });
  }
}
