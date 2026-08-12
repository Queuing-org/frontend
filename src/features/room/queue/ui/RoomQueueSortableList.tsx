"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
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
import { useQueueRenderWindow } from "./useQueueRenderWindow";

type MovePayload = {
  movedEntryId: string;
  beforeEntryId: string | null;
  orderedPendingEntryIds: string[];
};

type Props = {
  canDeleteEntry?: (entry: PlaylistEntry) => boolean;
  emptyMessage: ReactNode;
  entries: PlaylistEntry[];
  hasUnloadedEntries?: boolean;
  isDeletePending?: boolean;
  isMovePending?: boolean;
  moveMode: "owner" | "self";
  onDelete?: (entryId: string) => void;
  onMove?: (payload: MovePayload) => Promise<void>;
};

type PendingOrder = {
  orderedEntryIds: string[];
  sourceEntryIdsKey: string;
};

type SortableQueueCardProps = {
  disabled: boolean;
  entry: PlaylistEntry;
  isDragSessionActive: boolean;
  isDeletePending: boolean;
  onDelete?: (entryId: string) => void;
  showDeleteButton: boolean;
};

function SortableQueueCard({
  disabled,
  entry,
  isDragSessionActive,
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
      data-queue-virtual-item="true"
      style={
        isDragSessionActive
          ? {
              transform: CSS.Transform.toString(transform),
              transition,
            }
          : undefined
      }
      data-drag-disabled={disabled}
      data-dragging={isDragging}
      isDeletePending={isDeletePending}
      onDelete={onDelete}
      showDeleteButton={showDeleteButton}
    />
  );
}

type StaticQueueListProps = {
  canDeleteEntry?: (entry: PlaylistEntry) => boolean;
  className: string;
  entries: PlaylistEntry[];
  isDeletePending?: boolean;
  onDelete?: (entryId: string) => void;
};

function StaticQueueList({
  canDeleteEntry,
  className,
  entries,
  isDeletePending = false,
  onDelete,
}: StaticQueueListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const { endIndex, paddingBottom, paddingTop, startIndex } =
    useQueueRenderWindow(entries.length, listRef);

  if (entries.length === 0) {
    return null;
  }

  return (
    <ul ref={listRef} className={className}>
      {paddingTop > 0 ? (
        <li
          aria-hidden="true"
          className={styles.virtualSpacer}
          style={{ height: paddingTop }}
        />
      ) : null}
      {entries.slice(startIndex, endIndex).map((entry) => (
        <RoomQueueCard
          key={entry.entryId}
          entry={entry}
          data-drag-disabled="true"
          data-queue-virtual-item="true"
          isDeletePending={isDeletePending}
          onDelete={onDelete}
          showDeleteButton={canDeleteEntry?.(entry) ?? false}
        />
      ))}
      {paddingBottom > 0 ? (
        <li
          aria-hidden="true"
          className={styles.virtualSpacer}
          style={{ height: paddingBottom }}
        />
      ) : null}
    </ul>
  );
}

type SortableQueueListWindowProps = {
  activeEntryId: string | null;
  canDeleteEntry?: (entry: PlaylistEntry) => boolean;
  entries: PlaylistEntry[];
  isDeletePending: boolean;
  isMovePending: boolean;
  onDelete?: (entryId: string) => void;
};

function SortableQueueListWindow({
  activeEntryId,
  canDeleteEntry,
  entries,
  isDeletePending,
  isMovePending,
  onDelete,
}: SortableQueueListWindowProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const { endIndex, paddingBottom, paddingTop, startIndex } =
    useQueueRenderWindow(entries.length, listRef, activeEntryId !== null);
  const isDragging = activeEntryId !== null;
  const renderedEntries = isDragging
    ? entries
    : entries.slice(startIndex, endIndex);

  return (
    <SortableContext
      items={entries.map((entry) => entry.entryId)}
      strategy={verticalListSortingStrategy}
    >
      <ul
        ref={listRef}
        className={styles.sortableList}
        data-render-window={isDragging ? "all-during-drag" : "virtualized"}
      >
        {!isDragging && paddingTop > 0 ? (
          <li
            aria-hidden="true"
            className={styles.virtualSpacer}
            style={{ height: paddingTop }}
          />
        ) : null}
        {renderedEntries.map((entry) => (
          <SortableQueueCard
            key={entry.entryId}
            disabled={isMovePending || entries.length < 2}
            entry={entry}
            isDragSessionActive={isDragging}
            isDeletePending={isDeletePending}
            onDelete={onDelete}
            showDeleteButton={canDeleteEntry?.(entry) ?? true}
          />
        ))}
        {!isDragging && paddingBottom > 0 ? (
          <li
            aria-hidden="true"
            className={styles.virtualSpacer}
            style={{ height: paddingBottom }}
          />
        ) : null}
      </ul>
    </SortableContext>
  );
}

export default function RoomQueueSortableList({
  canDeleteEntry,
  emptyMessage,
  entries,
  hasUnloadedEntries = false,
  isDeletePending = false,
  isMovePending = false,
  moveMode,
  onDelete,
  onMove,
}: Props) {
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const activeFixedEntries = entries.filter((entry) => entry.status.isActive);
  const fixedEntries = entries.filter(
    (entry) => !isPendingQueueEntry(entry) && !entry.status.isActive,
  );
  const lockedPendingEntries = useMemo(
    () =>
      moveMode === "self"
        ? entries.filter(
            (entry) =>
              isPendingQueueEntry(entry) && entry.status.ownerOrderLocked,
          )
        : [],
    [entries, moveMode],
  );
  const pendingEntriesFromProps = useMemo(
    () =>
      entries.filter(
        (entry) =>
          isPendingQueueEntry(entry) &&
          (moveMode === "owner" || !entry.status.ownerOrderLocked),
      ),
    [entries, moveMode],
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
    const beforeEntryId = reorderedEntries[newIndex + 1]?.entryId ?? null;
    if (hasUnloadedEntries && beforeEntryId === null) {
      return;
    }
    setPendingOrder({
      orderedEntryIds: reorderedEntries.map((entry) => entry.entryId),
      sourceEntryIdsKey: pendingEntryIdsKey,
    });

    if (!onMove) {
      setPendingOrder(null);
      return;
    }

    const moveCompletion = onMove({
      beforeEntryId,
      movedEntryId: activeEntryId,
      orderedPendingEntryIds: reorderedEntries.map((entry) => entry.entryId),
    });
    void moveCompletion.then(
      () => setPendingOrder(null),
      () => setPendingOrder(null),
    );
  }

  if (entries.length === 0) {
    return <div className={listStyles.state}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.root}>
      {activeFixedEntries.length > 0 ? (
        <StaticQueueList
          className={styles.fixedTopList}
          entries={activeFixedEntries}
        />
      ) : null}
      {lockedPendingEntries.length > 0 ? (
        <StaticQueueList
          canDeleteEntry={canDeleteEntry ?? (() => true)}
          className={styles.fixedTopList}
          entries={lockedPendingEntries}
          isDeletePending={isDeletePending}
          onDelete={onDelete}
        />
      ) : null}
      {pendingEntries.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <SortableQueueListWindow
            activeEntryId={activeEntryId}
            canDeleteEntry={canDeleteEntry}
            entries={pendingEntries}
            isDeletePending={isDeletePending}
            isMovePending={isMovePending}
            onDelete={onDelete}
          />
          {typeof document !== "undefined"
            ? createPortal(
                <DragOverlay dropAnimation={null}>
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
        <StaticQueueList
          className={styles.fixedList}
          entries={fixedEntries}
        />
      ) : null}
    </div>
  );
}
