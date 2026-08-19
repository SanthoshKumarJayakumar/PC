import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("http envelope", () => {
  it("health responds with envelope", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe("kaelon-api");
  });

  it("rejects unauthenticated cart", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects unauthenticated admin", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("validates register body", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "bad" });
    expect(res.status).toBe(422);
  });
});
