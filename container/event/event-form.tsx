"use client";

import { Dispatch, SetStateAction } from "react";
import { ItemsType } from "@prisma/client";
import { UseFormReturn } from "react-hook-form";

import { toUpperCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EventFormSchemaType } from "./event";

interface EventFormProps {
  form: UseFormReturn<EventFormSchemaType>;
  onSubmitAction: (values: EventFormSchemaType) => void;
  title: string;
  isOpen: boolean;
  setIsOpenAction: Dispatch<SetStateAction<boolean>>;
}

export function EventForm({
  form,
  onSubmitAction,
  title,
  isOpen,
  setIsOpenAction,
}: EventFormProps) {
  return (
    <Credenza open={isOpen} onOpenChange={setIsOpenAction}>
      <CredenzaContent className="md:max-w-sm">
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <Form {...form}>
            <form className="mx-auto max-w-3xl space-y-8 py-10">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the event, e.g. "Tsuki Release #1"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Time</FormLabel>
                    <FormControl>
                      <DateRangePicker
                        className="w-full"
                        align="center"
                        initialDateFrom={form.getValues("start")}
                        initialDateTo={form.getValues("end")}
                        // disabledRange={{ before: new Date() }}
                        onUpdate={(value) => {
                          form.setValue(
                            "start",
                            value.range.from.toISOString()
                          );
                          if (value.range.to) {
                            form.setValue("end", value.range.to.toISOString());
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      The start and end date of the event.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="itemsReleaseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Items Release</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value[0]}
                      //TODO: Fix this
                      disabled={true}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the staff role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ItemsType).map((item) => (
                          <SelectItem key={item} value={item}>
                            {toUpperCase(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the item type that will be released.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CredenzaBody>
        <CredenzaFooter>
          <Button variant="destructive" onClick={() => setIsOpenAction(false)}>
            Close
          </Button>
          <Button onClick={() => form.handleSubmit(onSubmitAction)()}>
            {title}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
