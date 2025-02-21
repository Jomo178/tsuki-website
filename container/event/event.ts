import { ItemsType } from "@prisma/client";
import { z } from "zod";

export const eventFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required!" }),
  start: z.string().datetime(),
  end: z.string().datetime(),
  itemsReleaseType: z
    .array(z.nativeEnum(ItemsType))
    .min(1, "Event type is required."),
  createdById: z.string(),
});

export type EventFormSchemaType = z.infer<typeof eventFormSchema>;
