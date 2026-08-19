import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok, fail } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBuild } from "../compatibility/engine.js";
import { computePricing } from "../lib/pricing.js";

export const cartRouter = Router();
cartRouter.use(requireAuth);

async function getCart(userId) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      items: {
        include: {
          component: { include: { category: true, inventory: true } },
          configuration: { include: { parts: { include: { component: { include: { inventory: true, category: true } } } } } },
        },
      },
    },
  });
}

function summarize(cart) {
  const lines = [];
  for (const item of cart.items) {
    if (item.configuration) {
      const prices = item.configuration.parts.map((p) => Number(p.component.price));
      const pricing = computePricing(prices);
      lines.push({ ...item, pricing, unit: pricing.total });
    } else if (item.component) {
      const pricing = computePricing([Number(item.component.price)]);
      lines.push({ ...item, pricing, unit: pricing.total });
    }
  }
  const pricing = computePricing(lines.flatMap((l) => (l.configuration ? l.configuration.parts.map((p) => Number(p.component.price) * l.quantity) : [Number(l.component.price) * l.quantity])));
  return { ...cart, items: lines, pricing };
}

cartRouter.get("/", async (req, res, next) => {
  try {
    const cart = await getCart(req.user.id);
    return ok(res, summarize(cart));
  } catch (e) {
    next(e);
  }
});

cartRouter.post("/items", async (req, res, next) => {
  try {
    const cart = await getCart(req.user.id);
    if (req.body.configurationId) {
      const cfg = await prisma.configuration.findUnique({
        where: { id: req.body.configurationId },
        include: { parts: { include: { component: { include: { inventory: true } } } } },
      });
      if (!cfg) return fail(res, "NOT_FOUND", "Build not found.", 404);
      const result = validateBuild(cfg.parts.map((p) => ({ slot: p.slot, component: p.component })));
      if (!result.complete) {
        return fail(res, "COMPATIBILITY_ERROR", "Build is incomplete or incompatible.", 400, result);
      }
      for (const p of cfg.parts) {
        const avail = (p.component.inventory?.stock || 0) - (p.component.inventory?.reserved || 0);
        if (avail < 1) return fail(res, "OUT_OF_STOCK", `${p.component.name} is out of stock.`, 409);
      }
      await prisma.cartItem.create({
        data: { cartId: cart.id, type: cfg.isPrebuilt ? "PREBUILT" : "BUILD", configurationId: cfg.id, quantity: 1 },
      });
    } else if (req.body.componentId) {
      const c = await prisma.component.findUnique({ where: { id: req.body.componentId }, include: { inventory: true } });
      if (!c) return fail(res, "NOT_FOUND", "Component not found.", 404);
      const avail = (c.inventory?.stock || 0) - (c.inventory?.reserved || 0);
      if (avail < 1) return fail(res, "OUT_OF_STOCK", "Out of stock.", 409);
      await prisma.cartItem.create({
        data: { cartId: cart.id, type: "ACCESSORY", componentId: c.id, quantity: req.body.quantity || 1 },
      });
    } else {
      return fail(res, "VALIDATION", "configurationId or componentId required.", 422);
    }
    return ok(res, summarize(await getCart(req.user.id)), 201);
  } catch (e) {
    next(e);
  }
});

cartRouter.put("/items/:id", async (req, res, next) => {
  try {
    const qty = Math.max(1, Number(req.body.quantity || 1));
    await prisma.cartItem.update({ where: { id: req.params.id }, data: { quantity: qty } });
    return ok(res, summarize(await getCart(req.user.id)));
  } catch (e) {
    next(e);
  }
});

cartRouter.delete("/items/:id", async (req, res, next) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    return ok(res, summarize(await getCart(req.user.id)));
  } catch (e) {
    next(e);
  }
});
