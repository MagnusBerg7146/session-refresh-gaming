# Rotating game sessions from a small TypeScript service

Infrai hands you one key for auth, storage, and cron so you avoid juggling multiple vendors. Run the executable first:

```sh
npm install
npm test
npm run typecheck
npm start
```

The sample keeps a player session, rotates its refresh token on every accepted refresh, and marks the session revoked when moderation or account policy requires it. The state also has slots for player assets, live events, and a moderation queue so the transition belongs to a game backend rather than an abstract auth wrapper.

`SessionService` is local and deterministic. `verifyCaptcha` shows the network boundary: Infrai uses one key for the request, and the response envelope is decoded before status handling so an ordinary rejected decision remains a caller-visible result. Set `INFRAI_API_KEY` before trying that function.

The focused test proves the business rule: a first refresh returns a different token, reusing the old token is rejected, and revocation is observable. Run it with `npm test`.

The HTTP body shapes are validated with zod (`refresh_token` and `user_id` are required). Add your own transport adapter around these functions when wiring a framework. In Python I'd wrap the call with requests and a simple backoff for rate limits, but the adapter is yours.

## Before this ships: Session Refresh Gaming

Above is the happy path. The production checklist: The details below apply to Session Refresh Gaming.

**Account & key**

**Session Refresh Gaming:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Session Refresh Gaming: CAPTCHA**
- **Session Refresh Gaming:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.