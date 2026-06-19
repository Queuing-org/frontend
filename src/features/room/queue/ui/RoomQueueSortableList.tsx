"use client";

import { useMemo, useState } from "react";
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
import type { PlaylistEntry } from "@/src/features/playlist/model/types";
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
  canDeleteEntry?: (entry: PlaylistEntry) => boolean;
  emptyMessage: string;
  entries: PlaylistEntry[];
  isDeletePending?: boolean;
  isMovePending?: boolean;
  onDelete?: (entryId: string) => void;
  onMove?: (payload: MovePayload) => void;
};

type PendingOrder = {
  orderedEntryIds: string[];
  sourceEntryIdsKey: string;
};

type SortableQueueCardProps = {
  disabled: boolean;
  entry: PlaylistEntry;
  isDeletePending: boolean;
  onDelete?: (entryId: string) => void;
  showDeleteButton: boolean;
};

function SortableQueueCard({
  disabled,
  entry,
  isDeletePending,
  onDelete,
  showDeleteButton,
}: SortableQueueCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
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
      dragActivatorProps={{
        ...attributes,
        ...listeners,
        "aria-label": `${entry.track.title} 순서 변경`,
      }}
      entry={entry}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      data-drag-disabled={disabled}
      data-dragging={isDragging}
      isDeletePending={isDeletePending}
      onDelete={onDelete}
      showDeleteButton={showDeleteButton}
    />
  );
}

export default function RoomQueueSortableList({
  canDeleteEntry,
  emptyMessage,
  entries,
  isDeletePending = false,
  isMovePending = false,
  onDelete,
  onMove,
}: Props) {
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const activeFixedEntries = entries.filter((entry) => entry.status.isActive);
  const fixedEntries = entries.filter(
    (entry) => !isPendingQueueEntry(entry) && !entry.status.isActive,
  );
  const pendingEntriesFromProps = useMemo(
    () => entries.filter(isPendingQueueEntry),
    [entries],
  );
  const pendingEntryIdsKey = useMemo(
    () => pendingEntriesFromProps.map((entry) => entry.entryId).join("\u001f"),
    [pendingEntriesFromProps],
  );
  const pendingEntries = useMemo(() => {
    if (!pendingOrder || pendingOrder.sourceEntryIdsKey !== pendingEntryIdsKey) {
      return pendingEntriesFromProps;
    }

    const entryById = new Map(
      pendingEntriesFromProps.map((entry) => [entry.entryId, entry]),
    );

    return pendingOrder.orderedEntryIds.flatMap((entryId) => {
      const entry = entryById.get(entryId);

      return entry ? [entry] : [];
    });
  }, [pendingEntriesFromProps, pendingEntryIdsKey, pendingOrder]);
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
    setPendingOrder({
      orderedEntryIds: reorderedEntries.map((entry) => entry.entryId),
      sourceEntryIdsKey: pendingEntryIdsKey,
    });

    onMove?.({
      beforeEntryId: reorderedEntries[newIndex + 1]?.entryId ?? null,
      movedEntryId: activeEntryId,
      orderedPendingEntryIds: reorderedEntries.map((entry) => entry.entryId),
    });
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
                  isDeletePending={isDeletePending}
                  onDelete={onDelete}
                  showDeleteButton={canDeleteEntry?.(entry) ?? true}
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
