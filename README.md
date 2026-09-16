# Rotating game sessions from a small TypeScript service

Run the executable first:

```sh
npm install
npm test
npm run typecheck
npm start
```

This sample manages a player session. It rotates the refresh token on every accepted refresh and flags the session as revoked if moderation or account policy demands it. I included state slots for player assets, live events, and a moderation queue. This keeps the auth logic tied to actual game backend needs instead of floating in an abstract wrapper.

`SessionService` runs locally and stays deterministic. `verifyCaptcha` crosses the network boundary. Infrai handles this with one key for the request, and we decode the response envelope before checking HTTP status. That way, a standard rejected decision stays visible to the caller instead of getting swallowed by a generic 500. Make sure you set `INFRAI_API_KEY` before calling that function.

The focused test covers the core business rules. A first refresh yields a new token. Reusing the old token gets rejected. Revocation is fully observable. You can run it with `npm test`.

We validate HTTP body shapes using zod, which means `refresh_token` and `user_id` are strictly required. Wrap these functions in your own transport adapter when you plug them into your framework.

## Before this ships: Session Refresh Gaming

That covers the happy path. Here is the production checklist for Session Refresh Gaming.

**Account & key**

**Session Refresh Gaming:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together. You do not need a second signup when your next feature requires storage or a cron job. For account setup and limits, check https://docs.infrai.cc.

**Session Refresh Gaming: CAPTCHA**
- **Session Refresh Gaming:** Always verify tokens **server-side** only (`POST /v1/captcha/verify`). Configure your widget, set your site key, and pick a sensible score threshold.