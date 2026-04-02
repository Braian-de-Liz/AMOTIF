/* import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Fastify } from "../src/server.js";

describe("Health Route", () => {
  beforeAll(async () => {
    await Fastify.ready();
  });

  afterAll(async () => {
    await Fastify.close();
  });

  it("should return 200 and the correct schema format on GET /health", async () => {
    const response = await Fastify.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body).toHaveProperty("status", "ok");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("uptime");
    expect(typeof body.uptime).toBe("number");
  });
});
 */