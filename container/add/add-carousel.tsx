"use client";

import { useEffect, useState } from "react";
import { Events, Staff } from "@prisma/client";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { AddFormSchemaType, defaultAddFromValues } from "./add";
import AddButtonControl from "./add-button-control";
import AddForm from "./add-form";

interface AddCarouselProps {
  currentUser: Staff;
  event: Events;
  events: Events[];
}

export default function AddCarousel({
  currentUser,
  event,
  events,
}: AddCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [defaultFormValues] = defaultAddFromValues();

  const [itemsFormPropsValue, setItemsFormPropsValue] = useState<
    AddFormSchemaType[]
  >([
    {
      ...defaultFormValues,
      releaseDate: new Date(event.start).toISOString(),
      errors: [],
    },
  ]);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <>
      <AddButtonControl
        currentUser={currentUser}
        event={event}
        itmesFormPropsValue={itemsFormPropsValue}
        setItemsFormPropsValueAction={setItemsFormPropsValue}
        carouselCount={count}
        carouselApi={api}
        setCarouselCountAction={setCount}
        setCarouselCurrentIndexAction={setCurrent}
      />
      <Carousel setApi={setApi} className="w-full !max-w-xs sm:!max-w-sm">
        <CarouselContent>
          {itemsFormPropsValue?.map((itemsForm, index) => (
            <CarouselItem key={itemsForm.id}>
              <AddForm
                index={index}
                key={itemsForm.id}
                defaultValues={itemsForm}
                currentUser={currentUser}
                event={event}
                events={events}
                onFormChangeAction={(value) => {
                  setItemsFormPropsValue((prev) =>
                    prev.map((item, i) => (i === index ? value : item))
                  );
                }}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="py-2 text-center text-sm text-muted-foreground">
        issues {current} of {count}
      </div>
    </>
  );
}
