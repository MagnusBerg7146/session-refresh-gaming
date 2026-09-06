import assert from "node:assert/strict";
import { SessionService } from "../src/session_service.ts";

const service = new SessionService();
const first = service.create("player-42");
const next = service.refresh({ refresh_token: first.refresh_token });
assert.notEqual(next.refresh_token, first.refresh_token);
assert.throws(() => service.refresh({ refresh_token: first.refresh_token }), /SESSION_REVOKED/);
service.revoke(next.session_id);
assert.equal(service.state(next.session_id)?.revoked, true);
console.log("refresh rotation and revocation: ok");
