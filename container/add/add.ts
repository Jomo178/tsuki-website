import { z } from "zod";

import useLocalStorage from "@/hooks/use-local-storage";
import { CarouselApi } from "@/components/ui/carousel";

export const addFormSchema = z.object({
  id: z.string(),
  createdById: z.string().min(1, "Created By ID is required!"),
  eventId: z.string().min(1, "Event ID is required!"),
  name: z.string().min(1, "Issue Name is required!"),
  releaseDate: z.string().datetime(),
  era: z.string().min(1, "Issue Era is required!"),
  group: z.string().min(1, "Issue Group is required!"),
  code: z.string().min(1, "Issue Code is required!"),
  codeDuplicate: z.boolean().optional(),
  dropAble: z.boolean().optional().default(true),
  rarity: z
    .number()
    .int()
    .min(1, "Rarity Level is required!")
    .max(5, "Rarity Level cannot exceed 5!"),
  image: fileValidation(),
  errors: z
    .array(
      z
        .object({
          path: z.string().optional(),
          message: z.string().optional(),
        })
        .optional()
    )
    .optional()
    .default([]),
});

export type AddFormSchemaType = z.infer<typeof addFormSchema>;

function fileValidation(allowedExtensions: string[] = ["png", "jpg"]) {
  return z
    .any()
    .refine(
      (file) => file instanceof File,
      "File is required and must be a file."
    )
    .refine((file: File) => file?.name !== "", "File name cannot be empty.")
    .refine((file) => file.size < 5_000_000, "Max size is 5MB.")
    .refine(
      (file) => checkFileType(file, allowedExtensions),
      `Only ${allowedExtensions.join(", ")} formats are supported.`
    );
}

function checkFileType(
  file: File,
  allowedTypes: string[] = ["png", "jpg", "gif"]
) {
  if (file?.name) {
    const fileType = file.name.split(".").pop();
    if (fileType && allowedTypes.includes(fileType)) {
      return true;
    }
  }
  return false;
}

export const defaultAddFromValues = () => {
  return useLocalStorage<Omit<AddFormSchemaType, "errors" | "releaseDate">>(
    "tsukiDefaultAddFormValues",
    {
      id: "1",
      createdById: "",
      eventId: "",
      name: "",
      group: "",
      era: "",
      code: "",
      codeDuplicate: false,
      dropAble: true,
      rarity: 1,
      image: new File([""], "filename"),
    }
  );
};

export function scrollToCarousel(api: CarouselApi, index: number) {
  setTimeout(() => {
    if (api) {
      api?.scrollTo(index);
    }
  }, 0);
}
