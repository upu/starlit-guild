import { z } from "zod";
import { furnitureKinds, layoutError } from "./home-room-layout.ts";
export const homeLayoutSchema = z
  .array(
    z
      .object({
        id: z
          .string()
          .min(1)
          .max(48)
          .regex(/^[a-z0-9-]+$/),
        kind: z.enum(furnitureKinds).refine((kind) => kind !== "plot"),
        x: z.number().int().min(0).max(15),
        y: z.number().int().min(3).max(12),
      })
      .strict(),
  )
  .max(24)
  .superRefine((items, context) => {
    const message = layoutError(items, true);
    if (message) context.addIssue({ code: z.ZodIssueCode.custom, message });
    for (const kind of ["table", "bench", "desk"])
      if (!items.some((item) => item.kind === kind))
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "テーブル・作業台・事務机を残してください",
        });
  });
