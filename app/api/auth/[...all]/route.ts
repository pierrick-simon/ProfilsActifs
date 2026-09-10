import { auth } from "@/lib/auth";
import { toNextJsHandler} from "better-auth/next-js";

/**
 * @swagger
 * /api/auth/{all}:
 *   get:
 *     tags: [Auth]
 *     description: >
 *       Generic entry point delegated to better-auth: covers all of its
 *       sub-routes (session, OAuth callbacks, etc.) under /api/auth/*. Not
 *       documented route by route here — see the better-auth documentation for
 *       each sub-route.
 *     responses:
 *       200:
 *         description: Response depends on the better-auth sub-route called.
 *   post:
 *     tags: [Auth]
 *     description: >
 *       Generic entry point delegated to better-auth: covers all of its
 *       sub-routes (sign-in, sign-up, sign-out, etc.) under /api/auth/*. Not
 *       documented route by route here — see the better-auth documentation.
 *     responses:
 *       200:
 *         description: Response depends on the better-auth sub-route called.
 */
export const { GET, POST } = toNextJsHandler(auth);