# SaveByte Domain Modules Architecture

The `src/modules/` directory organizes the domain logic, types, validation schemas, and hooks for the 15 core SaveByte pillars across the closed-loop food lifecycle.

## Module Structure

Each domain module follows a standardized structure:
```
src/modules/<module-name>/
├── types.ts          # Domain interfaces, payloads, and DTOs
├── schema.ts         # Zod schemas for runtime input validation
├── service.ts        # Modular business logic and API callers
├── components/       # Domain-specific UI cards, modals, and charts
└── index.ts          # Public barrel export
```

## 15 SIH Core Modules

| Module | Category | Description |
| :--- | :--- | :--- |
| `ai-forecasting` | AI & Prediction | Kitchen demand forecasting, footfall, and event intelligence |
| `production-planning` | AI & Prediction | Batch sizing and daily prep recommendations |
| `surplus-detection` | AI & Prediction | Automated inventory shelf-life decay monitoring |
| `quality-expiry` | Quality & Sensing | IoT electronic nose and freshness telemetry |
| `matching-engine` | Redistribution | Autonomous surplus-to-recipient matching algorithm |
| `buy-for-me` | Redistribution | Discounted surplus marketplace for secondary consumers |
| `sponsor-a-meal` | Redistribution | Micro-donations and corporate CSR meal sponsorships |
| `food-requests` | Redistribution | NGO and shelter real-time demand broadcast engine |
| `industrial-recovery` | Circular Economy | Organic waste routing for compost and biogas plants |
| `logistics-routing` | Fleet & Logistics | Multi-stop cold-chain route optimization |
| `iot-telemetry` | Fleet & Logistics | LoRaWAN / BLE temperature and humidity sensor streams |
| `digital-twin` | Intelligence | Real-time operations simulation and scenario stress-testing |
| `processing-units` | Value Recovery | Optimization for secondary food processing facilities |
| `esg-analytics` | Sustainability | Scope 3 CO₂ offset ledger and audit certificate generator |
| `ai-copilot` | Intelligence | Conversational operations and kitchen dispatch assistant |
