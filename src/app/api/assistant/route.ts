import { getRobot, getSite, locales } from '@taksu/content';
import { z } from 'zod';
import { generateReply } from '@/server/ai';

const bodySchema = z.object({
  robot: z.string().max(32),
  site: z.string().max(64),
  locale: z.enum(locales),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(600),
      }),
    )
    .min(1)
    .max(16),
});

/** POST /api/assistant: answers a visitor's question for a robot at a sample venue. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }
  const robot = getRobot(parsed.data.robot);
  const site = getSite(parsed.data.site);
  if (!robot || !site) {
    return Response.json({ error: 'unknown_robot_or_site' }, { status: 404 });
  }

  const reply = await generateReply({
    robot,
    site,
    locale: parsed.data.locale,
    messages: parsed.data.messages.slice(-10),
  });
  return Response.json(reply, { headers: { 'cache-control': 'no-store' } });
}
