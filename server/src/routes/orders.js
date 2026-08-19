import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma.js";
import { ok, fail } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBuild } from "../compatibility/engine.js";
import { computePricing } from "../lib/pricing.js";
import { getPaymentProvider } from "../services/payment/index.js";

export const orderRouter = Router();
orderRouter.use(requireAuth);

function orderNumber() {
  return `KL-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
}

orderRouter.get("/", async (req, res, next) => {
  try {
    const items = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true, history: { orderBy: { createdAt: "asc" } }, payment: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

orderRouter.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: req.params.id }, { orderNumber: req.params.id }], userId: req.user.id },
      include: { items: true, history: { orderBy: { createdAt: "asc" } }, payment: true, address: true },
    });
    if (!order) return fail(res, "NOT_FOUND", "Order not found.", 404);
    return ok(res, order);
  } catch (e) {
    next(e);
  }
});

orderRouter.post("/", async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            component: { include: { inventory: true } },
            configuration: { include: { parts: { include: { component: { include: { inventory: true, category: true } } } } } },
          },
        },
      },
    });
    if (!cart?.items.length) return fail(res, "EMPTY_CART", "Cart is empty.", 400);

    const unitPrices = [];
    const snapshots = [];

    for (const item of cart.items) {
      if (item.configuration) {
        const result = validateBuild(item.configuration.parts.map((p) => ({ slot: p.slot, component: p.component })));
        if (!result.complete) return fail(res, "COMPATIBILITY_ERROR", "A build in the cart is invalid.", 400, result);
        for (const p of item.configuration.parts) {
          const avail = (p.component.inventory?.stock || 0) - (p.component.inventory?.reserved || 0);
          if (avail < item.quantity) return fail(res, "OUT_OF_STOCK", `${p.component.name} is out of stock.`, 409);
          unitPrices.push(Number(p.component.price) * item.quantity);
        }
        snapshots.push({
          type: item.type,
          configurationId: item.configurationId,
          name: item.configuration.name,
          sku: item.configuration.shareId,
          quantity: item.quantity,
          snapshot: {
            parts: item.configuration.parts.map((p) => ({
              slot: p.slot,
              sku: p.component.sku,
              name: p.component.name,
              price: Number(p.component.price),
            })),
            rgb: item.configuration.rgb,
          },
        });
      } else if (item.component) {
        const avail = (item.component.inventory?.stock || 0) - (item.component.inventory?.reserved || 0);
        if (avail < item.quantity) return fail(res, "OUT_OF_STOCK", `${item.component.name} is out of stock.`, 409);
        unitPrices.push(Number(item.component.price) * item.quantity);
        snapshots.push({
          type: "ACCESSORY",
          componentId: item.componentId,
          name: item.component.name,
          sku: item.component.sku,
          quantity: item.quantity,
          snapshot: { price: Number(item.component.price) },
        });
      }
    }

    let coupon = null;
    if (req.body.couponCode) {
      coupon = await prisma.coupon.findFirst({ where: { code: req.body.couponCode, active: true } });
    }
    const pricing = computePricing(unitPrices, coupon);

    let addressId = req.body.addressId || null;
    if (!addressId && req.body.address) {
      const a = req.body.address;
      const created = await prisma.address.create({
        data: {
          userId: req.user.id,
          line1: a.line1,
          line2: a.line2 || "",
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          phone: a.phone || req.user.mobile || "",
        },
      });
      addressId = created.id;
    }

    const method = (req.body.paymentMethod || "TEST").toUpperCase();
    const provider = getPaymentProvider(method === "COD" ? "cod" : "test");

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: orderNumber(),
          userId: req.user.id,
          addressId,
          subtotal: pricing.subtotal,
          gst: pricing.gst,
          delivery: pricing.delivery,
          discount: pricing.discount,
          total: pricing.total,
          couponCode: coupon?.code,
          items: {
            create: snapshots.map((s) => ({
              configurationId: s.configurationId || null,
              componentId: s.componentId || null,
              name: s.name,
              sku: s.sku,
              quantity: s.quantity,
              unitPrice: s.snapshot.price || s.snapshot.parts?.reduce((n, p) => n + p.price, 0) || 0,
              snapshot: s.snapshot,
            })),
          },
          history: { create: { status: "ORDER_RECEIVED", note: "Order placed" } },
        },
      });

      const pay = await provider.createPayment({ amount: pricing.total, orderId: created.id });
      await tx.payment.create({
        data: {
          orderId: created.id,
          provider: pay.provider,
          status: pay.status,
          amount: pricing.total,
          reference: pay.reference,
        },
      });
      await tx.order.update({
        where: { id: created.id },
        data: { paymentStatus: pay.status },
      });

      for (const item of cart.items) {
        const parts = item.configuration?.parts || (item.component ? [{ component: item.component }] : []);
        for (const p of parts) {
          await tx.inventory.update({
            where: { componentId: p.component.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, history: true, payment: true, address: true },
    });
    return ok(res, full, 201);
  } catch (e) {
    next(e);
  }
});
