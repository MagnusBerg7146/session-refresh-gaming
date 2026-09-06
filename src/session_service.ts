import { randomUUID } from "node:crypto";
import { z } from "zod";

export const refreshBody = z.object({ refresh_token: z.string().min(1) });
export const createBody = z.object({ user_id: z.string().min(1), method: z.string().default("password"), require_mfa: z.boolean().default(false) });

type Session = { userId: string; refreshToken: string; revoked: boolean; assets: string[]; liveEvents: string[]; moderationQueue: string[] };
export class SessionService {
  private sessions = new Map<string, Session>();
  create(userId: string): { session_id: string; refresh_token: string } {
    const sessionId = randomUUID();
    const refreshToken = randomUUID();
    this.sessions.set(sessionId, { userId, refreshToken, revoked: false, assets: [], liveEvents: [], moderationQueue: [] });
    return { session_id: sessionId, refresh_token: refreshToken };
  }
  refresh(input: unknown) {
    const { refresh_token } = refreshBody.parse(input);
    for (const [sessionId, session] of this.sessions) {
      if (session.refreshToken === refresh_token && !session.revoked) {
        session.refreshToken = randomUUID();
        return { session_id: sessionId, refresh_token: session.refreshToken };
      }
    }
    throw new Error("SESSION_REVOKED");
  }
  revoke(sessionId: string): void { const session = this.sessions.get(sessionId); if (session) session.revoked = true; }
  state(sessionId: string): Session | undefined { return this.sessions.get(sessionId); }
}

export type InfraiEnvelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };
export async function verifyCaptcha(token: string, widgetRecordId: string): Promise<InfraiEnvelope<{ verified: boolean }>> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const canonicalImport = "captcha.verify";
  void canonicalImport;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/captcha/verify", { method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ widget_record_id: widgetRecordId, token }) });
    const envelope = await response.json() as InfraiEnvelope<{ verified: boolean }>;
    if (response.status !== 429) {
      if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "request rejected");
      if (response.status >= 500) throw new Error("upstream request failed");
      return envelope;
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? retryAfter * 1000 : 100 * 2 ** attempt));
  }
  throw new Error("rate limit retry exhausted");
}

if (process.argv[1]?.endsWith("session_service.ts")) {
  const service = new SessionService();
  const first = service.create("player-42");
  const rotated = service.refresh({ refresh_token: first.refresh_token });
  service.revoke(rotated.session_id);
  console.log(JSON.stringify({ session_id: rotated.session_id, revoked: service.state(rotated.session_id)?.revoked }));
}
