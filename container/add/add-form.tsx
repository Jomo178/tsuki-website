"use client";

import { useState } from "react";
import Image from "next/image";
import Bunny from "@/public/images/bunny.svg";
import { zodResolver } from "@hookform/resolvers/zod";
import { Events, Staff } from "@prisma/client";
import { useForm } from "react-hook-form";

import { hasPermission, toUpperCase } from "@/lib/utils";
import { FileUploader } from "@/components/ui/file-uploader";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/ui/input";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { addFormSchema, AddFormSchemaType } from "./add";

interface AddFormProps {
  index: number;
  currentUser: Staff;
  event: Events;
  events: Events[];
  defaultValues?: AddFormSchemaType;
  hiddenFields?: (keyof AddFormSchemaType)[];
  onFormChangeAction: (form: AddFormSchemaType, index: number) => void;
}

export default function AddForm({
  index,
  currentUser,
  event,
  events,
  defaultValues = {} as any,
  hiddenFields = [],
  onFormChangeAction,
}: AddFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<AddFormSchemaType>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      ...defaultValues,
      createdById: currentUser.id,
      eventId: event.id,
      dropAble: event.name.includes("Custom") ? false : true,
    },
  });

  const isFieldHidden = (fieldName: keyof AddFormSchemaType) =>
    hiddenFields.includes(fieldName);

  const getFieldError = (fieldName: keyof AddFormSchemaType) =>
    defaultValues.errors?.find((error) => error?.path === fieldName)?.message ??
    "";

  return (
    <Form {...form}>
      <form
        className="p-4"
        onChange={() => onFormChangeAction(form.getValues(), index)}
      >
        <div className="ml-auto mr-auto h-full max-w-fit">
          <div className="flex h-full w-72 flex-col items-center gap-6">
            {!isFieldHidden("name") && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Card General Information</FormLabel>
                    <FormControl>
                      <FloatingLabelInput
                        {...field}
                        id="name"
                        label="Card Name"
                      />
                    </FormControl>
                    <FormMessage>{getFieldError("name")}</FormMessage>
                  </FormItem>
                )}
              />
            )}
            {!isFieldHidden("era") && (
              <FormField
                control={form.control}
                name="era"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <FloatingLabelInput
                        {...field}
                        id="era"
                        label="Card Era"
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>{getFieldError("era")}</FormMessage>
                  </FormItem>
                )}
              />
            )}
            {!isFieldHidden("group") && (
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <FloatingLabelInput
                        {...field}
                        id="group"
                        label="Card Group"
                      />
                    </FormControl>
                    <FormMessage>{getFieldError("group")}</FormMessage>
                  </FormItem>
                )}
              />
            )}
            {!isFieldHidden("code") && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="flex justify-between">
                      Card Code
                    </FormLabel>
                    <FormControl>
                      <FloatingLabelInput
                        {...field}
                        id="code"
                        label="Card Code"
                      />
                    </FormControl>
                    <FormMessage>{getFieldError("code")}</FormMessage>
                  </FormItem>
                )}
              />
            )}
            {!isFieldHidden("rarity") && (
              <>
                <Separator className="my-1" />
                <FormField
                  control={form.control}
                  name="rarity"
                  render={({ field, fieldState }) => {
                    return (
                      <FormItem className="w-full">
                        <FormLabel>Card Rarity</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              form.setValue("rarity", parseInt(value));
                            }}
                            value={field.value.toString()}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select the Card Rarity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Card Rarity</SelectLabel>
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <SelectItem
                                    key={index}
                                    value={(index + 1).toString()}
                                  >
                                    <div className="flex items-center gap-2">
                                      {Array.from({ length: index + 1 }).map(
                                        (_, starIndex) => (
                                          <Image
                                            src={Bunny}
                                            key={starIndex}
                                            className="!fill-white text-white"
                                            alt="bunny"
                                            width={20}
                                            height={20}
                                          />
                                        )
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage>{getFieldError("rarity")}</FormMessage>
                      </FormItem>
                    );
                  }}
                />
              </>
            )}
            {!isFieldHidden("eventId") && (
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Event</FormLabel>
                    <FormControl>
                      <MultipleSelector
                        disabled={hasPermission(currentUser, "handle:issues")}
                        title="Select Event"
                        placeholder="Select Event"
                        hidePlaceholderWhenSelected
                        hideClearAllButton
                        options={events.map((event) => ({
                          value: event.name,
                          label: event.name,
                        }))}
                        maxSelected={1}
                        emptyIndicator={
                          <p className="text-center text-sm">
                            No results found
                          </p>
                        }
                        value={
                          form.getValues("eventId") != ""
                            ? [
                                {
                                  value:
                                    events.find(
                                      (event) =>
                                        event.id === form.getValues("eventId")
                                    )?.name ?? "",
                                  label:
                                    events.find(
                                      (event) =>
                                        event.id === form.getValues("eventId")
                                    )?.name ?? "",
                                },
                              ]
                            : []
                        }
                        onClick={() => {}}
                        onChange={(value) => {
                          const selectedEvent = events.find(
                            (event) => event.name === value[0]?.value
                          );

                          form.setValue("eventId", selectedEvent?.id ?? "");
                          form.setValue(
                            "dropAble",
                            selectedEvent?.name.includes("Custom")
                              ? false
                              : true
                          );
                          onFormChangeAction(form.getValues(), index);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose the event that the card is related to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {!isFieldHidden("image") && (
              <>
                <Separator className="my-1" />
                <FormField
                  control={form.control}
                  name="image"
                  render={() => (
                    <FormItem className="w-full">
                      <FormLabel>Card Image</FormLabel>
                      <FormControl>
                        <FileUploader
                          value={
                            form.getValues("image")?.name &&
                            form.getValues("image").name !== "filename"
                              ? [form.getValues("image")]
                              : []
                          }
                          onValueChange={(value) => {
                            form.setValue("image", value[0]);

                            onFormChangeAction(form.getValues(), index);
                          }}
                        />
                      </FormControl>
                      <FormMessage>{getFieldError("image")}</FormMessage>
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
