import { createHash } from "node:crypto";

import { prisma } from "@/server/database/prisma";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export async function consumeRateLimit(
  scope: string,
  identifier: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const key = createHash("sha256")
    .update(`${scope}:${identifier}`)
    .digest("hex");
  const now = new Date();
  const nextReset = new Date(now.getTime() + options.windowMs);

  await prisma.$executeRaw`
    INSERT INTO \`RateLimit\` (\`key\`, \`count\`, \`resetAt\`, \`updatedAt\`)
    VALUES (${key}, 1, ${nextReset}, ${now})
    ON DUPLICATE KEY UPDATE
      \`count\` = IF(
        \`resetAt\` <= ${now},
        1,
        LEAST(\`count\` + 1, ${options.limit + 1})
      ),
      \`resetAt\` = IF(\`resetAt\` <= ${now}, ${nextReset}, \`resetAt\`),
      \`updatedAt\` = ${now}
  `;

  const current = await prisma.rateLimit.findUniqueOrThrow({ where: { key } });
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((current.resetAt.getTime() - now.getTime()) / 1000),
  );

  return {
    allowed: current.count <= options.limit,
    retryAfterSeconds: current.count <= options.limit ? 0 : retryAfterSeconds,
  };
}
