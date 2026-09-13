# SaveByte Core Services Layer

The `src/services/` directory contains centralized shared backend services and third-party API adapters.

## Services Architecture

- **`auth/`**: Clerk authentication utilities, session validation, and multi-tenant organization context.
- **`db/`**: Neon Postgres connection pools and Prisma client wrappers.
- **`telemetry/`**: Real-time IoT sensor data ingestion, buffer management, and freshness thresholds.
- **`notifications/`**: Webhook dispatchers, SMS/email alerts, and real-time WebSocket broadcasters.
- **`ai/`**: Model routing, structured outputs, and prompt pipelines for forecasting and matching.
