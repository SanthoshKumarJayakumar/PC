import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok, fail } from "../lib/http.js";
import { optionalAuth } from "../middleware/auth.js";

export const componentRouter = Router();

function serialize(c) {
  return {
    ...c,
    price: Number(c.price),
    available: Math.max(0, (c.inventory?.stock || 0) - (c.inventory?.reserved || 0)),
    model: c.models?.[0] || null,
  };
}

componentRouter.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { category, brand, minPrice, maxPrice, inStock, q, page = 1, pageSize = 24 } = req.query;
    const where = { active: true };
    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: String(category) } });
      if (cat) where.categoryId = cat.id;
      else where.category = { slug: String(category) };
    }
    if (brand) where.brand = String(brand);
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: "insensitive" } },
        { brand: { contains: String(q), mode: "insensitive" } },
        { sku: { contains: String(q), mode: "insensitive" } },
      ];
    }
    if (inStock === "true") where.inventory = { stock: { gt: 0 } };

    const take = Math.min(60, Number(pageSize) || 24);
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;
    const [items, total, categories] = await Promise.all([
      prisma.component.findMany({
        where,
        include: { category: true, inventory: true, models: { where: { active: true }, take: 1 } },
        orderBy: { price: "asc" },
        skip,
        take,
      }),
      prisma.component.count({ where }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
    return ok(res, { items: items.map(serialize), total, page: Number(page) || 1, categories });
  } catch (e) {
    next(e);
  }
});

componentRouter.get("/:id", async (req, res, next) => {
  try {
    const c = await prisma.component.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      include: { category: true, inventory: true, models: true, reviews: { take: 8, orderBy: { createdAt: "desc" } } },
    });
    if (!c) return fail(res, "NOT_FOUND", "Component not found.", 404);
    return ok(res, serialize(c));
  } catch (e) {
    next(e);
  }
});

componentRouter.get("/:id/model", async (req, res, next) => {
  try {
    const c = await prisma.component.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      include: { models: { where: { active: true } } },
    });
    if (!c) return fail(res, "NOT_FOUND", "Component not found.", 404);
    return ok(res, { model: c.models[0] || null, category: c.categoryId, placeholder: !c.models[0]?.modelUrl });
  } catch (e) {
    next(e);
  }
});
