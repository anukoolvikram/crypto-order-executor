# Solana Order Execution Engine

A high-concurrency backend engine designed to route and execute **Market Orders** across Solana DEXs (simulating Raydium and Meteora). Built with an event-driven architecture ensuring scalability, fault tolerance, and real-time updates.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 🏗 System Architecture

The system uses an **Asynchronous, Event-Driven Architecture** to handle high throughput without blocking the main API thread.

### The Workflow
1.  **Ingestion:** User submits an order via HTTP POST.
2.  **Persistence:** Order is immediately saved to **PostgreSQL** (status: `pending`).
3.  **Queuing:** The job is pushed to a **BullMQ** queue (backed by Redis). The API immediately responds with an `orderId`.
4.  **Processing:** A dedicated **Worker** picks up the job:
    * **Routing:** Fetches mock quotes from Raydium & Meteora.
    * **Decision:** Selects the DEX with the best price.
    * **Execution:** Simulates the swap transaction (with randomized slippage).
5.  **Streaming:** Updates are published via **Redis Pub/Sub**, which the WebSocket server listens to and forwards to the client in real-time.

### Key Design Decisions

#### 1. Why Market Orders?
I chose to implement **Market Orders** to demonstrate the core complexity of the **Routing Engine**.
* **Logic:** Unlike Limit orders (which wait passively for a trigger), Market orders require immediate, competitive price analysis.
* **Challenge:** This tests the system's ability to handle latency, fetch concurrent quotes, and execute transaction logic immediately under load.

#### 2. Decoupling via Redis Pub/Sub
Instead of the Worker talking directly to the WebSocket connection, I used Redis Pub/Sub as a bridge.
* **Benefit:** This allows the Worker (execution logic) and the API (connection logic) to scale independently. The Worker doesn't need to know *who* is connected, just that an event occurred.

#### 3. Concurrency & Reliability
* **Queue:** Configured to process **10 concurrent orders** with a rate limit of 100 orders/minute.
* **Retries:** Implemented **Exponential Backoff**. If a DEX interaction fails (simulated network error), the system retries up to 3 times before marking the order as `failed`.

---

## 🛠 Tech Stack

* **Runtime:** Node.js + TypeScript
* **API Framework:** Fastify (v5)
* **Database:** PostgreSQL (Persistent storage)
* **Queue:** BullMQ (Job management)
* **Broker:** Redis (Queue storage & Pub/Sub messaging)
* **Testing:** Jest (Unit & Integration tests)

---

## 🚀 Setup & Installation

### Prerequisites
* Node.js (v18+)
* PostgreSQL (running locally or via Docker)
* Redis (running locally or via Docker)

### 1. Clone & Install
```bash
git clone https://github.com/anukoolvikram/crypto-order-executor
cd crypto-order-executor
npm install
npm run dev
