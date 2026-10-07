"use client";
import { useState } from "react";
import {
  defaultHome,
  roomFurniture,
  layoutError,
  type Furniture,
  type FurnitureKind,
} from "@/lib/home-room-layout";
import { homeLayoutSchema } from "@/lib/home-room-schema";
import type { HomeRoomProps } from "./home-room";
export function useFurniture(props: HomeRoomProps) {
  const { draft, setDraft, selected, select, adding, setAdding, message, setMessage } =
    useFurnitureState();
  const items = draft ?? roomFurniture(props.site, props.layout);
  const place = (item: Furniture) => {
    const next = [...items.filter((f) => f.id !== item.id), item],
      error = layoutError(next);
    if (error) {
      setMessage(error);
      return;
    }
    setDraft(next);
    select(item.id);
    setAdding(undefined);
    setMessage("置き場所を変更しました。");
  };
  const cancel = () => {
    setDraft(null);
    select(undefined);
    setAdding(undefined);
    setMessage("");
  };
  return {
    items,
    draft,
    selected,
    adding,
    message,
    select,
    place,
    cancel,
    edit: () => {
      setDraft(structuredClone(items));
    },
    add: (kind: FurnitureKind) => {
      setAdding({ id: `f-${crypto.randomUUID()}`, kind, x: 0, y: 3 });
      select(undefined);
      setMessage("空いているマスをタップしてください。");
    },
    move: (dx: number, dy: number) => {
      const item = items.find((f) => f.id === selected);
      if (item) place({ ...item, x: item.x + dx, y: item.y + dy });
    },
    remove: () => {
      setDraft(items.filter((f) => f.id !== selected));
      select(undefined);
    },
    reset: () => {
      setDraft(structuredClone(defaultHome));
    },
    save: () => {
      const parsed = homeLayoutSchema.safeParse(items);
      if (!parsed.success) {
        setMessage(parsed.error.issues[0].message);
        return;
      }
      if (props.onLayout?.(parsed.data) !== false) cancel();
    },
  };
}

function useFurnitureState() {
  const [draft, setDraft] = useState<Furniture[] | null>(null),
    [selected, select] = useState<string>(),
    [adding, setAdding] = useState<Furniture>(),
    [message, setMessage] = useState("");
  return { draft, setDraft, selected, select, adding, setAdding, message, setMessage };
}
