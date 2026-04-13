"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PlaylistEntry } from "@/src/entities/playlist/model/types";
import { isPendingQueueEntry } from "../model/roomQueue";
import RoomQueueCard from "./RoomQueueCard";
import listStyles from "./RoomQueueList.module.css";
import styles from "./RoomQueueSortableList.module.css";
import { createPortal } from "react-dom";

type MovePayload = {
  movedEntryId: string;
  beforeEntryId: string | null;
  orderedPendingEntryIds: string[];
};

type Props = {
  emptyMessage: string;
  entries: PlaylistEntry[];
  errorMessage?: string;
  isLoading?: boolean;
  isMovePending?: boolean;
  onMove?: (payload: MovePayload) => void;
};

type SortableQueueCardProps = {
  disabled: boolean;
  entry: PlaylistEntry;
};

function SortableQueueCard({ disabled, entry }: SortableQueueCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    disabled,
    id: entry.entryId,
  });

  return (
    <RoomQueueCard
      ref={setNodeRef}
      dragHandleProps={{
        ...attributes,
        ...listeners,
        disabled,
      }}
      dragHandleRef={setActivatorNodeRef}
      entry={entry}
      showDragHandle
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      data-drag-disabled={disabled}
      data-dragging={isDragging}
    />
  );
}

export default function RoomQueueSortableList({
  emptyMessage,
  entries,
  errorMessage,
  isLoading = false,
  isMovePending = false,
  onMove,
}: Props) {
  const [pendingEntries, setPendingEntries] = useState<PlaylistEntry[]>(
    entries.filter(isPendingQueueEntry),
  );
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const activeFixedEntries = entries.filter((entry) => entry.status.isActive);
  const fixedEntries = entries.filter(
    (entry) => !isPendingQueueEntry(entry) && !entry.status.isActive,
  );
  const activeEntry = useMemo(
    () =>
      activeEntryId
        ? pendingEntries.find((entry) => entry.entryId === activeEntryId) ?? null
        : null,
    [activeEntryId, pendingEntries],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setPendingEntries(entries.filter(isPendingQueueEntry));
  }, [entries]);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveEntryId(String(active.id));
  }

  function handleDragCancel() {
    setActiveEntryId(null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const activeEntryId = String(active.id);
    const overEntryId = over ? String(over.id) : null;
    setActiveEntryId(null);

    if (!overEntryId || activeEntryId === overEntryId || isMovePending) {
      return;
    }

    const oldIndex = pendingEntries.findIndex(
      (entry) => entry.entryId === activeEntryId,
    );
    const newIndex = pendingEntries.findIndex(
      (entry) => entry.entryId === overEntryId,
    );

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      return;
    }

    const reorderedEntries = arrayMove(pendingEntries, oldIndex, newIndex);
    setPendingEntries(reorderedEntries);

    onMove?.({
      beforeEntryId: reorderedEntries[newIndex + 1]?.entryId ?? null,
      movedEntryId: activeEntryId,
      orderedPendingEntryIds: reorderedEntries.map((entry) => entry.entryId),
    });
  }

  if (isLoading) {
    return (
      <div className={listStyles.state}>플레이리스트를 불러오는 중입니다.</div>
    );
  }

  if (errorMessage) {
    return <div className={listStyles.state}>{errorMessage}</div>;
  }

  if (entries.length === 0) {
    return <div className={listStyles.state}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.root}>
      {activeFixedEntries.length > 0 ? (
        <ul className={styles.fixedTopList}>
          {activeFixedEntries.map((entry) => (
            <RoomQueueCard
              key={entry.entryId}
              entry={entry}
              data-drag-disabled="true"
            />
          ))}
        </ul>
      ) : null}
      {pendingEntries.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <SortableContext
            items={pendingEntries.map((entry) => entry.entryId)}
            strategy={verticalListSortingStrategy}
          >
            <ul className={styles.sortableList}>
              {pendingEntries.map((entry) => (
                <SortableQueueCard
                  key={entry.entryId}
                  disabled={isMovePending || pendingEntries.length < 2}
                  entry={entry}
                />
              ))}
            </ul>
          </SortableContext>
          {typeof document !== "undefined"
            ? createPortal(
                <DragOverlay>
                  {activeEntry ? (
                    <RoomQueueCard entry={activeEntry} data-drag-overlay="true" />
                  ) : null}
                </DragOverlay>,
                document.body,
              )
            : null}
        </DndContext>
      ) : null}
      {fixedEntries.length > 0 ? (
        <ul className={styles.fixedList}>
          {fixedEntries.map((entry) => (
            <RoomQueueCard
              key={entry.entryId}
              entry={entry}
              data-drag-disabled="true"
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
