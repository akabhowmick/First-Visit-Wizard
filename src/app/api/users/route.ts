import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcrypt";

type Step =
  | { step: 1; email: string; password: string }
  | { step: 2; data: Record<string, unknown> }
  | { step: 3; data: Record<string, unknown> };

type UserData = {
  aboutMe?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  birthdate?: string;
};

const SALT_ROUNDS = 10;

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      aboutMe: true,
      street: true,
      city: true,
      state: true,
      zip: true,
      birthdate: true,
      stepCompleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Step;

  // STEP 1: Create user, set cookie
  if (body.step === 1) {
    const { email, password } = body;
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash: hash }, // if returning user restarts, refresh hash
      create: { email, passwordHash: hash },
    });

    // HttpOnly cookie with uid so we can resume
    const res = NextResponse.json({ ok: true, id: user.id, stepCompleted: user.stepCompleted });
    res.cookies.set("uid", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  // STEP 2 or 3: Update partial fields and progress
  // Identify user from cookie
  const uid = await (async () => {
    // Helper to read cookies in route handlers (NextResponse does not read request cookies)
    const cookieHeader = req.headers.get("cookie") || "";
    return cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("uid="))
      ?.split("=")[1];
  })();

  if (!uid)
    return NextResponse.json({ error: "No user session. Complete step 1 first." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (body.step === 2) {
    const { aboutMe, street, city, state, zip, birthdate } = body.data as UserData;
    const updated = await prisma.user.update({
      where: { id: uid },
      data: {
        aboutMe: aboutMe ?? user.aboutMe,
        street: street ?? user.street,
        city: city ?? user.city,
        state: state ?? user.state,
        zip: zip ?? user.zip,
        birthdate: birthdate ? new Date(birthdate) : user.birthdate,
        stepCompleted: Math.max(user.stepCompleted, 2),
      },
      select: { id: true, stepCompleted: true },
    });
    return NextResponse.json({ ok: true, ...updated });
  }

  if (body.step === 3) {
    const { aboutMe, street, city, state, zip, birthdate } = body.data as UserData;
    const updated = await prisma.user.update({
      where: { id: uid },
      data: {
        aboutMe: aboutMe ?? user.aboutMe,
        street: street ?? user.street,
        city: city ?? user.city,
        state: state ?? user.state,
        zip: zip ?? user.zip,
        birthdate: birthdate ? new Date(birthdate) : user.birthdate,
        stepCompleted: Math.max(user.stepCompleted, 3),
      },
      select: { id: true, stepCompleted: true },
    });
    return NextResponse.json({ ok: true, ...updated });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
