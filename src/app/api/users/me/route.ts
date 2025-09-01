import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const uid = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("uid="))
    ?.split("=")[1];
  if (!uid) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: uid },
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
    },
  });

  return NextResponse.json({ user });
}
