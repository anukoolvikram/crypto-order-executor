# Solana Order Execution Engine

A high-concurrency backend engine designed to route and execute **Market Orders** across Solana DEXs (simulating Raydium and Meteora). Built with an event-driven architecture ensuring scalability, fault tolerance, and real-time updates.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge\&logo=typescript\&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge\&logo=fastify\&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge\&logo=redis\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge\&logo=postgresql\&logoColor=white)

---

## Live Demo Link: 
https://crypto-order-executor.onrender.com

## 🏗 System Architecture

The system uses an **Asynchronous, Event-Driven Architecture** to handle high throughput without blocking the main API thread.

### The Workflow

1. **Ingestion:** User submits an order via HTTP POST.
2. **Persistence:** Order is immediately saved to **PostgreSQL** (status: `pending`).
3. **Queuing:** The job is pushed to a **BullMQ** queue (backed by Redis). The API immediately responds with an `orderId`.
4. **Processing:** A dedicated **Worker** picks up the job:

   * **Routing:** Fetches mock quotes from Raydium & Meteora.
   * **Decision:** Selects the DEX with the best price.
   * **Execution:** Simulates the swap transaction (with randomized slippage).
5. **Streaming:** Updates are published via **Redis Pub/Sub**, which the WebSocket server listens to and forwards to the client in real-time.

### Key Design Decisions

#### 1. Why Market Orders?

I chose to implement **Market Orders** to demonstrate the core complexity of the **Routing Engine**.

* Market orders require immediate execution and competitive price analysis.
* Tests system latency, routing accuracy, and engine performance.

#### 2. Decoupling via Redis Pub/Sub

Instead of the Worker talking directly to the WebSocket server:

* Worker publishes events to Redis.
* WebSocket server listens and pushes to connected clients.
* Allows independent scaling of Worker and API.

#### 3. Concurrency & Reliability

* **Queue:** 10 concurrent workers, rate-limited to 100 orders/min.
* **Retries:** Exponential backoff, 3 retry attempts.
* **Status Flow:** `pending → routing → executing → confirmed` or `failed`.

---

## 🛠 Tech Stack

* **Runtime:** Node.js + TypeScript
* **API Framework:** Fastify (v5)
* **Database:** PostgreSQL
* **Queue:** BullMQ
* **Broker:** Redis
* **Testing:** Jest

---

## 🚀 Setup & Installation

### Prerequisites

* Node.js 18+
* PostgreSQL
* Redis

### 1. Clone & Install

```bash
git clone https://github.com/anukoolvikram/crypto-order-executor
cd crypto-order-executor
npm install
```

### 2. Configure Environment

Create a `.env` file:

```
PORT=3000
# Database
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=order_engine
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Run Application

```bash
# Dev Mode
npm run dev

# Production
npm run build
npm start
```

### 4. Run Tests

```bash
npm test
```

---

## 🔌 API Documentation

### 1. Execute Order

**POST** `/api/orders/execute`

#### Body

```json
{
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amount": 1.5
}
```

#### Response

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

### 2. WebSocket Stream

Connect to receive real-time updates.

```
ws://localhost:3000/api/orders/ws?orderId=<ORDER_ID>
```

---

## 🔮 Extensibility

* **Limit Orders:** Add a PriceWatcher service.
* **Sniper Orders:** Add MempoolMonitor for pool initialization detection.
* **Multi-DEX Support:** Add more DEX quote providers.

---

## 📂 Project Structure

```
src/
├── config/         # DB and Redis setup
├── controllers/    # Optional route handlers
├── services/
│   ├── dexRouter.ts # Mock Raydium/Meteora quotes
│   └── queue.ts     # BullMQ worker logic
├── types/          # TypeScript interfaces
└── server.ts       # Fastify + WebSocket entry

tests/
└── order.test.ts   # Jest test suite
```
