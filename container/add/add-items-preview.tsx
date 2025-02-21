"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { addIssues } from "@/server/add-action";
import { Staff } from "@prisma/client";
import { CloudUpload, Eye, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { cn, hasPermission } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CarouselApi } from "@/components/ui/carousel";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { checkForDuplicatedIssueCodes } from "@/app/(dashboard)/dashboard/action";

import { addFormSchema, AddFormSchemaType, scrollToCarousel } from "./add";

interface AddItemsPreviewProps {
  itmesFormPropsValue: AddFormSchemaType[];
  setItemsFormPropsValueAction: React.Dispatch<
    React.SetStateAction<AddFormSchemaType[]>
  >;
  defaultValues: AddFormSchemaType;
  carouselApi: CarouselApi;
  currentUser: Staff;
}

export default function AddItemsPreview({
  itmesFormPropsValue,
  setItemsFormPropsValueAction,
  defaultValues,
  carouselApi,
  currentUser,
}: AddItemsPreviewProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(0);
  const [uploadingResponse, setUploadingResponse] = useState<
    {
      variant: "success" | "error";
      message?: string;
    }[]
  >([]);

  const openPreview = async () => {
    const formErrors = itmesFormPropsValue.map((item, index) => {
      const checkEmptyProps = addFormSchema.safeParse(item);

      return (
        checkEmptyProps.error?.issues.map((error) => ({
          index,
          path: error.path[0].toString(),
          message: error.message,
        })) || []
      );
    });

    if (formErrors.length > 0) {
      setItemsFormPropsValueAction((prev) => {
        return prev.map((item, index) => {
          const errors = formErrors[index];
          return {
            ...item,
            errors: errors.length > 0 ? errors : [],
          };
        });
      });

      for (let i = 0; i < formErrors.length; i++) {
        if (!formErrors[i].length) continue;
        toast.error(`Issue Form Error`, {
          description: `Please fill out the required fields before uploading.`,
          action: {
            label: "Jump",
            onClick: () =>
              scrollToCarousel(carouselApi, formErrors[i][0].index),
          },
        });
        break;
      }
    }

    if (formErrors.some((errors) => errors.length > 0)) return;

    const checkCodesPromise = checkForDuplicatedIssueCodes(
      itmesFormPropsValue.map((item) => item.code)
    );

    toast.promise(checkCodesPromise, {
      loading: `Checking for duplicate issue codes...`,
      success: `Duplicate issue codes have been checked successfully.`,
      error: `Error checking duplicate issue codes.`,
    });

    const checkCodes = await checkCodesPromise;

    setItemsFormPropsValueAction((prev) => {
      return prev.map((item) => {
        if (!checkCodes.includes(item.code)) return item;
        return {
          ...item,
          codeDuplicate: true,
          errors: checkCodes.includes(item.code)
            ? [
                ...(item.errors || []),
                {
                  message: `Duplicate Issue Code`,
                  path: "code",
                },
              ]
            : item.errors,
        };
      });
    });

    if (checkCodes.length != 0) {
      for (let i = 0; i < checkCodes.length; i++) {
        toast.error("Duplicate Issue Code", {
          description:
            "Please change the issue code to a unique one before uploading.",
          action: {
            label: "Jump to Form",
            onClick: () =>
              scrollToCarousel(
                carouselApi,
                itmesFormPropsValue.findIndex(
                  (item) => item.code === checkCodes[i]
                )
              ),
          },
        });
        break;
      }
      return;
    }

    setOpenDialog(true);
  };

  const onSubmit = async () => {
    setOpenUpload(true);
    setIsUploading(true);

    const uploadPromises = itmesFormPropsValue.map((item, index) =>
      addIssues({
        ...item,
      })
        .then(({ message, variant }) => {
          setUploadingProgress(
            ((index + 1) / itmesFormPropsValue.length) * 100
          );
          return {
            variant,
            message,
          };
        })
        .catch((error) => {
          return {
            variant: "error" as const,
            message: error.message as string,
          };
        })
    );

    const responses = await Promise.all(uploadPromises);
    setUploadingResponse(responses);

    const failedItems = itmesFormPropsValue.filter(
      (_, index) => responses[index].variant === "error"
    );

    setItemsFormPropsValueAction(() =>
      failedItems.length > 0
        ? failedItems
        : [{ ...defaultValues, id: Math.random().toString() }]
    );

    setOpenDialog(false);
    setIsUploading(false);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={openPreview}
            disabled={hasPermission(currentUser, "create:issues")}
          >
            <Eye size={24} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Upload Preview</p>
        </TooltipContent>
      </Tooltip>

      <Credenza open={openUpload} onOpenChange={setOpenUpload}>
        <CredenzaContent className="sm:max-w-[600px]">
          <CredenzaHeader>
            <CredenzaTitle>Uploading Issues</CredenzaTitle>
            <CredenzaDescription>
              {isUploading
                ? `Uploading the issues. Please wait until the process is complete.`
                : `All issues have been uploaded successfully.`}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="my-4 flex flex-col items-center space-y-4">
            {isUploading && (
              <div className="flex flex-row items-center gap-4">
                <Loader2 className="animate-spin" size={32} />
                <p>Uploading</p>
              </div>
            )}
            <div className="flex w-full items-center gap-4">
              <Progress value={uploadingProgress} className="h-4 w-full" />
              <p>{uploadingProgress.toPrecision(3)}%</p>
            </div>
            <ScrollArea className="h-48 w-full text-center">
              {uploadingResponse.map((item, index) => (
                <p
                  key={index}
                  className={cn(
                    "!mt-0 mb-1 leading-7 [&:not(:first-child)]:mt-6",
                    item.variant === "error" && "text-red-500",
                    item.variant === "success" && "text-green-500"
                  )}
                >
                  {item.variant === "success"
                    ? `Issues ${index + 1} ${item.message}`
                    : `Issues ${index + 1} ${item.message}`}
                </p>
              ))}
            </ScrollArea>
          </CredenzaBody>
          <CredenzaFooter className="flex flex-row justify-center">
            <Button
              isLoading={isUploading}
              onClick={() => {
                setOpenUpload(false);
                setOpenDialog(false);
                setUploadingProgress(0);
                setUploadingResponse([]);
              }}
            >
              Close
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      <Sheet open={openDialog} onOpenChange={setOpenDialog}>
        <SheetContent className="!w-full p-4 sm:max-w-none">
          <SheetHeader className="border-b-2 pb-4">
            <SheetTitle>All Issues Preview</SheetTitle>
            <SheetDescription>
              Scroll through all the issues to review their details.
            </SheetDescription>
          </SheetHeader>
          <div className="grid h-[80vh] grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
            {itmesFormPropsValue.map((item, index) => {
              return <CardPreview item={item} key={item.id} />;
            })}
          </div>
          <div className="flex flex-row sm:col-span-2 md:col-span-4 md:justify-end">
            <Button
              className="mb-4 w-full md:mr-8 md:w-auto"
              onClick={onSubmit}
            >
              <CloudUpload />
              Upload Issues
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function CardPreview({ item }: { item: AddFormSchemaType }) {
  const imageUrl = useMemo(() => {
    if (item.image && Object.keys(item.image).length > 0) {
      return URL.createObjectURL(item.image);
    }
    return "";
  }, [item.image]);

  return (
    <Card
      className="mx-auto mb-10 flex w-full max-w-xs items-center border-0 sm:flex-col"
      key={item.id}
    >
      <CardContent className="flex aspect-auto items-center justify-center p-0">
        {Object.keys(item.image).length > 0 && (
          <Image
            src={imageUrl}
            alt={item.name}
            className="max-w-48 rounded-md"
            width={192}
            height={162}
          />
        )}
      </CardContent>
      <Separator className="mx-auto my-4 hidden max-w-[50%] sm:block" />
      <CardHeader className="w-full p-0 text-center">
        <div className="mx-[25%] flex min-h-full max-w-[50%] flex-row">
          <Separator
            orientation="vertical"
            className="hidden w-[2px] sm:block"
          />
          <div className="sm:flex-1">
            <TextInformation title="Name" description={item.name} />

            <TextInformation title="Group" description={item.group} />

            <TextInformation title="Era" description={item.era} />

            <TextInformation title="Code" description={item.code} />

            <div className="flex items-center justify-between">
              <Separator className="hidden h-[2px] w-4 sm:block" />
              <span className="text-left text-sm font-medium leading-none text-muted-foreground">
                Rarity:
              </span>
              <span className="!mt-0 flex w-1/2 text-left text-sm font-medium leading-none text-muted-foreground">
                {Array.from({ length: item.rarity }).map((_, starIndex) => (
                  <Star key={starIndex} size={16} />
                ))}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function TextInformation({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <Separator className="hidden h-[2px] w-4 sm:block" />
      <span className="text-left text-sm font-medium leading-none text-muted-foreground">
        {title}:
      </span>
      <span className="!mt-0 w-1/2 text-left text-base font-medium leading-none">
        {description}
      </span>
    </div>
  );
}
