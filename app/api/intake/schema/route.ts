import { NextResponse } from "next/server";
import { loadIntakeByToken } from "@/lib/intake/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "demo-token";
  const data = await loadIntakeByToken(token);
  return NextResponse.json(data);
}
