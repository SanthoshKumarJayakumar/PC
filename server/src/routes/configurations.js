import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma.js";
import { ok, fail } from "../lib/http.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { validateBuild } from "../compatibility/engine.js";
import { computePricing } from "../lib/pricing.js";

export const configRouter = Router();

const includeParts = {
  parts: { include: { component: { include: { category: true, inventory: true, models: { take: 1 } } } } },
};

function hydrate(cfg) {
  const parts = cfg.parts.map((p) => ({
    slot: p.slot,
    quantity: p.quantity,
    component: { ...p.component, price: Number(p.component.price) },
  }));
  const result = validateBuild(parts.map((p) => ({ slot: p.slot, component: p.component })));
  const pricing = computePricing(parts.map((p) => Number(p.component.price) * p.quantity));
  return { ...cfg, parts, compatibility: result, pricing, power: result.power };
}

async function loadIds(selection) {
  const entries = Object.entries(selection || {}).filter(([, v]) => v);
  const out = [];
  for (const [slot, value] of entries) {
    const ids = Array.isArray(value) ? value : [value];
    let i = 0;
    for (const id of ids) {
      const component = await prisma.component.findUnique({
        where: { id },
        include: { category: true, inventory: true, models: { take: 1 } },
      });
      if (!component || !component.active) throw Object.assign(new Error("Unknown component"), { status: 400, code: "INVALID_COMPONENT" });
      out.push({ slot, sortOrder: i++, component });
    }
  }
  return out;
}

configRouter.post("/validate", async (req, res, next) => {
  try {
    const parts = await loadIds(req.body.components || {});
    const wattages = (
      await prisma.component.findMany({
        where: { category: { slug: "psu" }, active: true },
      })
    )
      .map((c) => Number(c.compatibilityMetadata?.wattage || 0))
      .filter(Boolean)
      .sort((a, b) => a - b);
    const result = validateBuild(
      parts.map((p) => ({ slot: p.slot, component: p.component })),
      wattages.length ? wattages : undefined,
    );
    const pricing = computePricing(parts.map((p) => Number(p.component.price)));
    return ok(res, { ...result, pricing, parts: parts.map((p) => ({ slot: p.slot, component: { ...p.component, price: Number(p.component.price) } })) });
  } catch (e) {
    next(e);
  }
});

configRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const list = await prisma.configuration.findMany({
      where: { userId: req.user.id, isPrebuilt: false },
      include: includeParts,
      orderBy: { updatedAt: "desc" },
    });
    return ok(res, { items: list.map(hydrate) });
  } catch (e) {
    next(e);
  }
});

configRouter.get("/prebuilt", async (_req, res, next) => {
  try {
    const list = await prisma.configuration.findMany({
      where: { isPrebuilt: true, isPublic: true },
      include: includeParts,
      orderBy: { name: "asc" },
    });
    return ok(res, { items: list.map(hydrate) });
  } catch (e) {
    next(e);
  }
});

configRouter.get("/share/:shareId", optionalAuth, async (req, res, next) => {
  try {
    const cfg = await prisma.configuration.findUnique({
      where: { shareId: req.params.shareId },
      include: includeParts,
    });
    if (!cfg || (!cfg.isPublic && cfg.userId !== req.user?.id)) return fail(res, "NOT_FOUND", "Build not found.", 404);
    return ok(res, hydrate(cfg));
  } catch (e) {
    next(e);
  }
});

configRouter.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const cfg = await prisma.configuration.findUnique({ where: { id: req.params.id }, include: includeParts });
    if (!cfg) return fail(res, "NOT_FOUND", "Configuration not found.", 404);
    if (!cfg.isPublic && cfg.userId !== req.user?.id && req.user?.role !== "ADMIN") {
      return fail(res, "FORBIDDEN", "Not allowed.", 403);
    }
    return ok(res, hydrate(cfg));
  } catch (e) {
    next(e);
  }
});

async function persistConfig(userId, body, existingId) {
  const parts = await loadIds(body.components || {});
  const rgb = body.rgb || { enabled: true, mode: "static", color: "#00eaff", speed: 1, brightness: 0.8 };
  const data = {
    userId,
    name: body.name || "Untitled build",
    rgb,
    isPublic: Boolean(body.isPublic),
  };
  if (existingId) {
    await prisma.configurationComponent.deleteMany({ where: { configurationId: existingId } });
    return prisma.configuration.update({
      where: { id: existingId },
      data: {
        ...data,
        parts: { create: parts.map((p) => ({ slot: p.slot, componentId: p.component.id, quantity: 1, sortOrder: p.sortOrder })) },
      },
      include: includeParts,
    });
  }
  return prisma.configuration.create({
    data: {
      ...data,
      shareId: nanoid(10),
      parts: { create: parts.map((p) => ({ slot: p.slot, componentId: p.component.id, quantity: 1, sortOrder: p.sortOrder })) },
    },
    include: includeParts,
  });
}

configRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const cfg = await persistConfig(req.user.id, req.body);
    return ok(res, hydrate(cfg), 201);
  } catch (e) {
    next(e);
  }
});

configRouter.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.configuration.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return fail(res, "NOT_FOUND", "Configuration not found.", 404);
    const cfg = await persistConfig(req.user.id, req.body, existing.id);
    return ok(res, hydrate(cfg));
  } catch (e) {
    next(e);
  }
});

configRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.configuration.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return fail(res, "NOT_FOUND", "Configuration not found.", 404);
    await prisma.configuration.delete({ where: { id: existing.id } });
    return ok(res, {});
  } catch (e) {
    next(e);
  }
});

configRouter.post("/:id/duplicate", requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.configuration.findUnique({ where: { id: req.params.id }, include: { parts: true } });
    if (!existing) return fail(res, "NOT_FOUND", "Configuration not found.", 404);
    const copy = await prisma.configuration.create({
      data: {
        userId: req.user.id,
        name: `${existing.name} copy`,
        shareId: nanoid(10),
        rgb: existing.rgb,
        isPublic: false,
        parts: {
          create: existing.parts.map((p) => ({
            slot: p.slot,
            componentId: p.componentId,
            quantity: p.quantity,
            sortOrder: p.sortOrder,
          })),
        },
      },
      include: includeParts,
    });
    return ok(res, hydrate(copy), 201);
  } catch (e) {
    next(e);
  }
});
