import Redis from "ioredis";

const redisOptions = {};
const rawRedisUrl = process.env.REDIS_URL?.trim();
const validRedisUrl = rawRedisUrl && /^(redis|rediss):\/\//i.test(rawRedisUrl);

if (validRedisUrl) {
  redisOptions.url = rawRedisUrl;
} else {
  if (rawRedisUrl) {
    console.warn(
      "⚠️ Ignoring invalid REDIS_URL, falling back to REDIS_HOST/REDIS_PORT.",
    );
  }
  if (process.env.REDIS_HOST) {
    redisOptions.host = process.env.REDIS_HOST;
  }
  if (process.env.REDIS_PORT) {
    redisOptions.port = Number(process.env.REDIS_PORT);
  }
  if (process.env.REDIS_PASSWORD) {
    redisOptions.password = process.env.REDIS_PASSWORD;
  }
}

if (
  process.env.REDIS_TLS === "true" ||
  (validRedisUrl && rawRedisUrl.startsWith("rediss://"))
) {
  redisOptions.tls = {};
}

const redisClient = new Redis({
  ...redisOptions,
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
});

redisClient.on("connect", () => {
  console.log("✅ Redis Connected");
});

redisClient.on("error", (err) => {
  const message = err && err.message ? err.message : JSON.stringify(err);
  console.log("❌ Redis Error:", message);
});

redisClient.safeGet = async (key) => {
  if (!key) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    const message =
      error && error.message ? error.message : JSON.stringify(error);
    console.error("Redis safeGet error:", message);
    return null;
  }
};

redisClient.safeSet = async (key, value, ttlSeconds = 0) => {
  if (!key) return false;
  try {
    const payload = typeof value === "string" ? value : JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redisClient.set(key, payload, "EX", ttlSeconds);
    } else {
      await redisClient.set(key, payload);
    }
    return true;
  } catch (error) {
    const message =
      error && error.message ? error.message : JSON.stringify(error);
    console.error("Redis safeSet error:", message);
    return false;
  }
};

redisClient.safeGetJson = async (key) => {
  const value = await redisClient.safeGet(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    const message =
      error && error.message ? error.message : JSON.stringify(error);
    console.error("Redis safeGetJson error:", message);
    return null;
  }
};

redisClient.safeSetJson = async (key, value, ttlSeconds = 0) => {
  return await redisClient.safeSet(key, value, ttlSeconds);
};

redisClient.safeDel = async (key) => {
  if (!key) return 0;
  try {
    return await redisClient.del(key);
  } catch (error) {
    const message =
      error && error.message ? error.message : JSON.stringify(error);
    console.error("Redis safeDel error:", message);
    return 0;
  }
};

redisClient.safeDelPattern = async (pattern) => {
  if (!pattern) return 0;
  try {
    const keys = await redisClient.keys(pattern);
    if (!keys || keys.length === 0) return 0;
    return await redisClient.del(...keys);
  } catch (error) {
    const message =
      error && error.message ? error.message : JSON.stringify(error);
    console.error("Redis safeDelPattern error:", message);
    return 0;
  }
};

export default redisClient;
