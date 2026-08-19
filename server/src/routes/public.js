import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

export const publicRouter = Router();

publicRouter.get("/health", async (_req, res) => {
  let db = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }
  return ok(res, { service: "kaelon-api", db, time: new Date().toISOString() });
});

export const supportRouter = Router();
supportRouter.use(requireAuth);

supportRouter.get("/tickets", async (req, res, next) => {
  try {
    const items = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      include: { messages: true },
      orderBy: { updatedAt: "desc" },
    });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

supportRouter.post("/tickets", async (req, res, next) => {
  try {
    const t = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        category: req.body.category || "general",
        subject: req.body.subject,
        messages: { create: { authorId: req.user.id, body: req.body.description || "" } },
      },
      include: { messages: true },
    });
    return ok(res, t, 201);
  } catch (e) {
    next(e);
  }
});

supportRouter.post("/tickets/:id/messages", async (req, res, next) => {
  try {
    const t = await prisma.supportTicket.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!t) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found." } });
    await prisma.supportMessage.create({ data: { ticketId: t.id, authorId: req.user.id, body: req.body.body } });
    const full = await prisma.supportTicket.findUnique({ where: { id: t.id }, include: { messages: true } });
    return ok(res, full);
  } catch (e) {
    next(e);
  }
});
