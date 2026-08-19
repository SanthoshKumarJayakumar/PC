import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("auth + catalog persistence", () => {
  it("lists seeded components", async () => {
    const res = await request(app).get("/api/components?category=gpu");
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it("validates incompatible GPU vs compact case", async () => {
    const gpu = await request(app).get("/api/components?category=gpu&q=V90");
    const cabinet = await request(app).get("/api/components?category=cabinet&q=Pocket");
    const gpuId = gpu.body.data.items[0]?.id;
    const caseId = cabinet.body.data.items[0]?.id;
    expect(gpuId && caseId).toBeTruthy();
    const res = await request(app).post("/api/configurations/validate").send({
      components: { gpu: gpuId, cabinet: caseId },
    });
    expect(res.body.data.errors.some((e) => e.code === "GPU_LENGTH")).toBe(true);
  });

  it("registers a unique user", async () => {
    const email = `t${Date.now()}@kaelon.test`;
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "User",
        email,
        mobile: "9000000000",
        password: "password12",
        confirmPassword: "password12",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });
});
