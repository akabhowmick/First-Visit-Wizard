import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { configSchema, isValidPartition, DEFAULT_CONFIG } from "../../../lib/configValidation";

export async function GET() {
  // Seed-on-read: if no row, create default
  let cfg = await prisma.config.findUnique({ where: { id: 1 } });
  if (!cfg) {
    cfg = await prisma.config.create({
      data: { id: 1, step2: DEFAULT_CONFIG.step2, step3: DEFAULT_CONFIG.step3 },
    });
  }
  return NextResponse.json({ step2: cfg.step2, step3: cfg.step3 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const payload = parsed.data;
  if (!isValidPartition(payload)) {
    return NextResponse.json(
      { error: "Each component must appear on exactly one of steps 2 or 3, and both steps need at least one." },
      { status: 400 }
    );
  }
  const updated = await prisma.config.upsert({
    where: { id: 1 },
    update: { step2: payload.step2, step3: payload.step3 },
    create: { id: 1, step2: payload.step2, step3: payload.step3 },
  });
  return NextResponse.json({ step2: updated.step2, step3: updated.step3 });
}
