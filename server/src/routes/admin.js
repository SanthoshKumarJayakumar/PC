import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok, fail } from "../lib/http.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/stats", async (_req, res, next) => {
  try {
    const [users, orders, revenueAgg, openTickets, lowStock] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.inventory.count({ where: { stock: { lte: 3 } } }),
    ]);
    return ok(res, {
      users,
      orders,
      revenue: Number(revenueAgg._sum.total || 0),
      openTickets,
      lowStock,
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/components", async (_req, res, next) => {
  try {
    const items = await prisma.component.findMany({
      include: { category: true, inventory: true, models: true },
      orderBy: { updatedAt: "desc" },
    });
    return ok(res, { items: items.map((c) => ({ ...c, price: Number(c.price) })) });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/components", async (req, res, next) => {
  try {
    const c = await prisma.component.create({
      data: {
        sku: req.body.sku,
        name: req.body.name,
        slug: req.body.slug,
        brand: req.body.brand,
        categoryId: req.body.categoryId,
        description: req.body.description || "",
        price: req.body.price,
        powerConsumption: req.body.powerConsumption || 0,
        specifications: req.body.specifications || {},
        compatibilityMetadata: req.body.compatibilityMetadata || {},
        dimensions: req.body.dimensions || {},
        active: req.body.active !== false,
        inventory: { create: { stock: req.body.stock || 0 } },
      },
    });
    return ok(res, c, 201);
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/components/:id", async (req, res, next) => {
  try {
    const c = await prisma.component.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        price: req.body.price,
        active: req.body.active,
        description: req.body.description,
        powerConsumption: req.body.powerConsumption,
        specifications: req.body.specifications,
        compatibilityMetadata: req.body.compatibilityMetadata,
        dimensions: req.body.dimensions,
      },
    });
    if (typeof req.body.stock === "number") {
      await prisma.inventory.upsert({
        where: { componentId: c.id },
        create: { componentId: c.id, stock: req.body.stock },
        update: { stock: req.body.stock },
      });
    }
    return ok(res, c);
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/components/:id", async (req, res, next) => {
  try {
    await prisma.component.update({ where: { id: req.params.id }, data: { active: false } });
    return ok(res, {});
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/models", async (_req, res, next) => {
  try {
    const items = await prisma.component3DModel.findMany({ include: { component: { include: { category: true } } } });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/models/:id", async (req, res, next) => {
  try {
    const m = await prisma.component3DModel.update({
      where: { id: req.params.id },
      data: {
        modelUrl: req.body.modelUrl,
        thumbnailUrl: req.body.thumbnailUrl,
        positionX: req.body.positionX,
        positionY: req.body.positionY,
        positionZ: req.body.positionZ,
        rotationX: req.body.rotationX,
        rotationY: req.body.rotationY,
        rotationZ: req.body.rotationZ,
        scaleX: req.body.scaleX,
        scaleY: req.body.scaleY,
        scaleZ: req.body.scaleZ,
        assembledTransform: req.body.assembledTransform,
        explodedTransform: req.body.explodedTransform,
        mountPoint: req.body.mountPoint,
        active: req.body.active,
      },
    });
    return ok(res, m);
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/models", async (req, res, next) => {
  try {
    const m = await prisma.component3DModel.create({
      data: {
        componentId: req.body.componentId,
        modelUrl: req.body.modelUrl || null,
        positionX: req.body.positionX || 0,
        positionY: req.body.positionY || 0,
        positionZ: req.body.positionZ || 0,
        assembledTransform: req.body.assembledTransform || {},
        explodedTransform: req.body.explodedTransform || {},
      },
    });
    return ok(res, m, 201);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/compatibility", async (_req, res, next) => {
  try {
    const items = await prisma.compatibilityRule.findMany({ orderBy: { code: "asc" } });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/compatibility/:id", async (req, res, next) => {
  try {
    const r = await prisma.compatibilityRule.update({
      where: { id: req.params.id },
      data: { name: req.body.name, params: req.body.params, active: req.body.active },
    });
    return ok(res, r);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/inventory", async (_req, res, next) => {
  try {
    const items = await prisma.inventory.findMany({ include: { component: true }, orderBy: { stock: "asc" } });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/orders", async (_req, res, next) => {
  try {
    const items = await prisma.order.findMany({
      include: { user: true, items: true, history: true, payment: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/orders/:id/status", async (req, res, next) => {
  try {
    const status = req.body.status;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        trackingNumber: req.body.trackingNumber,
        paymentStatus: req.body.paymentStatus,
        history: { create: { status, note: req.body.note || null } },
      },
      include: { history: true },
    });
    return ok(res, order);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const items = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/users/:id", async (req, res, next) => {
  try {
    const u = await prisma.user.update({
      where: { id: req.params.id },
      data: { active: req.body.active, role: req.body.role },
    });
    return ok(res, { id: u.id, active: u.active, role: u.role });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/coupons", async (_req, res, next) => {
  try {
    return ok(res, { items: await prisma.coupon.findMany() });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/coupons", async (req, res, next) => {
  try {
    const c = await prisma.coupon.create({
      data: { code: req.body.code, percentOff: req.body.percentOff, amountOff: req.body.amountOff, active: true },
    });
    return ok(res, c, 201);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/tickets", async (_req, res, next) => {
  try {
    const items = await prisma.supportTicket.findMany({ include: { user: true, messages: true } });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/analytics", async (_req, res, next) => {
  try {
    const byStatus = await prisma.order.groupBy({ by: ["status"], _count: true, _sum: { total: true } });
    return ok(res, { byStatus });
  } catch (e) {
    next(e);
  }
});
