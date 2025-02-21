"use client";

import { useEffect, useState } from "react";
import { Events, Staff } from "@prisma/client";

import { ItemListingView, ItemsNameType, ItemType } from "@/types/view";
import { toUpperCase, urlToFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { ScrollArea } from "@/components/ui/scroll-area";

import { AddFormSchemaType } from "../add/add";
import AddForm from "../add/add-form";
import { usehandleApprovePendingItems } from "./handlers";

interface EditItemsDialogProps<T extends ItemsNameType> {
  itemNameType: T;
  item: ItemType<T>[0] | ItemType<T>[1];
  viewPortType: ItemListingView<T>;
  setViewTypeDataAction?: React.Dispatch<
    React.SetStateAction<ItemListingView<T>>
  >;
  openDialog: boolean;
  setOpenDialogAction: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser: Staff;
  event: Events;
}

export default function EditItemsDialog<T extends ItemsNameType>({
  itemNameType,
  item,
  openDialog,
  viewPortType,
  setViewTypeDataAction,
  setOpenDialogAction,
  currentUser,
  event,
}: EditItemsDialogProps<T>) {
  const [imageLoaded, setImageLoaded] = useState(false);
  let defaultValues;

  defaultValues = {
    ...item,
    codeDuplicate: false,
    releaseDate: new Date(),
    image: new File([], "filename"),
    imageLink: "image" in item ? item.image : "",
    changedImage: false,
    errors: [],
  };

  const [itemData, setItemData] = useState<
    AddFormSchemaType & { imageLink: string; changedImage: boolean }
  >(defaultValues as any);
  const { handleEditItems } = usehandleApprovePendingItems(
    itemNameType,
    setViewTypeDataAction
  );

  useEffect(() => {
    const fetchImage = async () => {
      if (
        "image" in item &&
        item.image &&
        openDialog &&
        itemData.image.size === 0
      ) {
        const file = await urlToFile(
          item.image,
          item.name + ".png",
          "image/png"
        );

        setItemData((prev) => ({ ...prev, image: file }));
        setImageLoaded(true);
      }
    };

    fetchImage();
  }, [item, openDialog]);

  const handleEdit = async () => {
    await handleEditItems({
      itemsViewPortId: viewPortType.id,
      item: itemData,
    });

    setOpenDialogAction(false);
  };

  return (
    <>
      <Credenza
        open={openDialog}
        onOpenChange={() => {
          setOpenDialogAction(false);
          setImageLoaded(false);
          setItemData(defaultValues as any);
        }}
      >
        <CredenzaContent className="sm:max-w-[600px]">
          <CredenzaHeader>
            <CredenzaTitle>
              Edit Pending {toUpperCase(itemNameType.slice(0, -1))}
            </CredenzaTitle>
            <CredenzaDescription>
              Edit the pending {itemNameType.slice(0, -1)} details.
            </CredenzaDescription>
          </CredenzaHeader>

          <CredenzaBody className="col-span-3 grid h-full content-start space-y-4">
            <ScrollArea className="max-h-80 w-full md:!max-h-full">
              {imageLoaded ? (
                <EditFrom
                  itemNameType={itemNameType}
                  itemData={itemData}
                  setItemDataAction={setItemData}
                  currentUser={currentUser}
                  event={event}
                />
              ) : (
                <p>Loading image...</p>
              )}
            </ScrollArea>
          </CredenzaBody>
          <CredenzaFooter className="flex flex-row justify-center">
            <Button
              onClick={() => setOpenDialogAction(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save</Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}

interface EditFromProps<T extends ItemsNameType> {
  itemNameType: T;
  itemData: AddFormSchemaType;
  setItemDataAction: React.Dispatch<
    React.SetStateAction<
      AddFormSchemaType & { imageLink: string; changedImage: boolean }
    >
  >;
  currentUser: Staff;
  event: Events;
}

function EditFrom<T extends ItemsNameType>({
  itemNameType,
  itemData,
  setItemDataAction,
  currentUser,
  event,
}: EditFromProps<T>) {
  return (
    <AddForm
      index={1}
      hiddenFields={["releaseDate"]}
      defaultValues={itemData}
      currentUser={currentUser}
      event={event}
      events={[...new Set([event])]}
      onFormChangeAction={(value) => {
        setItemDataAction((prev) => {
          if (
            prev.image?.size !== value.image?.size &&
            prev.image?.name !== value.image?.name
          ) {
            return { ...value, imageLink: prev.imageLink, changedImage: true };
          }
          return { ...prev, ...value };
        });
      }}
    />
  );
}
