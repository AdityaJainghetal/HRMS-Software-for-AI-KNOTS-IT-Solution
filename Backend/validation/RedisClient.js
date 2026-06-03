import Redis from "ioredis";

let redisClient;

if (process.env.NODE_ENV === "production" && process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    tls: {},
    maxRetriesPerRequest: null,
  });
} else {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  });
}

redisClient.on("connect", () => {
  console.log("✅ Redis Connected");
});

redisClient.on("error", (err) => {
  console.log("❌ Redis Error:", err.message);
});

export default redisClient;