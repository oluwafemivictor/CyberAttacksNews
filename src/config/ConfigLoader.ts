import * as fs from 'fs';
import * as path from 'path';

export interface Config {
  app: {
    port: number;
    env: 'development' | 'production' | 'test';
    nodeEnv: string;
  };
  database: {
    type: 'memory' | 'postgres' | 'mongodb';
    url?: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
  deduplication: {
    threshold: number;
    enabled: boolean;
  };
  webhooks: {
    timeout: number;
    retries: number;
  };
}

class ConfigLoader {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    const env = process.env.NODE_ENV || 'development';

    return {
      app: {
        port: parseInt(process.env.PORT || '3000', 10),
        env: env as any,
        nodeEnv: env
      },
      database: {
        type: (process.env.DB_TYPE || 'memory') as any,
        url: process.env.DATABASE_URL
      },
      logging: {
        level: (process.env.LOG_LEVEL || 'info') as any,
        format: (process.env.LOG_FORMAT || 'text') as any
      },
      deduplication: {
        threshold: parseFloat(process.env.DEDUP_THRESHOLD || '0.85'),
        enabled: process.env.DEDUP_ENABLED !== 'false'
      },
      webhooks: {
        timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000', 10),
        retries: parseInt(process.env.WEBHOOK_RETRIES || '3', 10)
      }
    };
  }

  get(): Config {
    return this.config;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (this.config.app.port < 1 || this.config.app.port > 65535) {
      errors.push('PORT must be between 1 and 65535');
    }

    if (!['memory', 'postgres', 'mongodb'].includes(this.config.database.type)) {
      errors.push('DB_TYPE must be one of: memory, postgres, mongodb');
    }

    if (this.config.deduplication.threshold < 0 || this.config.deduplication.threshold > 1) {
      errors.push('DEDUP_THRESHOLD must be between 0 and 1');
    }

    if (this.config.webhooks.timeout < 1000) {
      errors.push('WEBHOOK_TIMEOUT must be at least 1000ms');
    }

    return errors;
  }

  static createEnvFile(): void {
    const envExample = `# Application
NODE_ENV=development
PORT=3000

# Database
DB_TYPE=memory
# DATABASE_URL=postgresql://user:password@localhost/cyberattacksnews

# Logging
LOG_LEVEL=info
LOG_FORMAT=text

# Deduplication
DEDUP_THRESHOLD=0.85
DEDUP_ENABLED=true

# Webhooks
WEBHOOK_TIMEOUT=5000
WEBHOOK_RETRIES=3
`;

    const envFile = path.join(process.cwd(), '.env.example');
    if (!fs.existsSync(envFile)) {
      fs.writeFileSync(envFile, envExample);
      console.log('Created .env.example');
    }
  }
}

export const configLoader = new ConfigLoader();
