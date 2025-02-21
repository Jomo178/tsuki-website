"use client";

import { useState } from "react";
import { Events, Staff } from "@prisma/client";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CarouselApi } from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  AddFormSchemaType,
  defaultAddFromValues,
  scrollToCarousel,
} from "./add";
import { ItemsCustomPropertiesDialog } from "./add-custom-form";
import AddItemsPreview from "./add-items-preview";

interface AddButtonControlProps {
  itmesFormPropsValue: AddFormSchemaType[];
  setItemsFormPropsValueAction: React.Dispatch<
    React.SetStateAction<AddFormSchemaType[]>
  >;
  carouselApi: CarouselApi;
  carouselCount: number;
  setCarouselCountAction: React.Dispatch<React.SetStateAction<number>>;
  setCarouselCurrentIndexAction: React.Dispatch<React.SetStateAction<number>>;
  currentUser: Staff;
  event: Events;
}

export default function AddButtonControl({
  itmesFormPropsValue,
  setItemsFormPropsValueAction,
  carouselApi,
  carouselCount,
  setCarouselCountAction,
  setCarouselCurrentIndexAction,
  currentUser,
  event,
}: AddButtonControlProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [getNewCustomProps, setNewCustomProps] = defaultAddFromValues();

  return (
    <>
      <div className="mb-4 flex flex-col items-center justify-center gap-4">
        <div className="flex justify-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={carouselCount - 1 == 0}
                onClick={() => {
                  setItemsFormPropsValueAction((prev) => {
                    const indexToDelete =
                      carouselApi?.selectedScrollSnap() ?? 0;
                    const updatedData = prev.filter(
                      (_, index) => index !== indexToDelete
                    );

                    const newIndex = Math.min(
                      indexToDelete,
                      updatedData.length - 1
                    );
                    setCarouselCountAction(updatedData.length);
                    setCarouselCurrentIndexAction(newIndex == 0 ? 1 : newIndex);
                    return updatedData;
                  });
                }}
              >
                <Trash2 size={24} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Issue Form</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={carouselCount == 15}
                onClick={() => {
                  setItemsFormPropsValueAction((prev) => [
                    ...prev,
                    {
                      ...getNewCustomProps,
                      id: Math.random().toString(),
                      releaseDate: new Date(event.start).toISOString(),
                      errors: [],
                    },
                  ]);

                  setCarouselCountAction(itmesFormPropsValue.length + 1);
                  scrollToCarousel(carouselApi, itmesFormPropsValue.length);
                }}
              >
                <Plus size={24} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Issue Form</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setOpenDialog((prev) => !prev)}
              >
                <MixerHorizontalIcon className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Custom Properties</p>
            </TooltipContent>
          </Tooltip>
          <AddItemsPreview
            itmesFormPropsValue={itmesFormPropsValue}
            setItemsFormPropsValueAction={setItemsFormPropsValueAction}
            defaultValues={{
              ...getNewCustomProps,
              releaseDate: new Date(event.start).toISOString(),
              errors: [],
            }}
            carouselApi={carouselApi}
            currentUser={currentUser}
          />
        </div>
      </div>

      <ItemsCustomPropertiesDialog
        setItemFormPropsValueAction={setItemsFormPropsValueAction}
        currentUser={currentUser}
        openDialog={openDialog}
        setOpenDialogAction={setOpenDialog}
        getNewCustomProps={{
          ...getNewCustomProps,
          releaseDate: new Date(event.start).toISOString(),
          errors: [],
        }}
        setNewCustomPropsAction={setNewCustomProps as any}
        event={event}
      />
    </>
  );
}
