"use client";

import { useRef } from "react";
import Draggable from "react-draggable";
import type { DraggableData } from "react-draggable";
import type {
  FloatingWidgetsView,
  WidgetId,
} from "@/src/widgets/room/model/useFloatingWidgetsState";
import type { CurrentRequesterProfile } from "@/src/features/room/profile/model/types";
import RoomProfilePanel from "@/src/features/room/profile/ui/RoomProfilePanel";
import RoomQueuePanel from "@/src/features/room/queue/ui/RoomQueuePanel";
import FloatingRoomPanelShell from "./FloatingRoomPanelShell";
import styles from "./RoomFloatingWidgets.module.css";

type Props = {
  currentRequester: CurrentRequesterProfile | null;
  currentTrackTitle?: string | null;
  onActivateWidget: (widgetId: WidgetId) => void;
  onWidgetStop: (widgetId: WidgetId, data: DraggableData) => void;
  roomPassword?: string | null;
  roomSlug: string;
  widgets: FloatingWidgetsView;
};

export default function RoomFloatingWidgets({
  currentRequester,
  currentTrackTitle,
  onActivateWidget,
  onWidgetStop,
  roomPassword,
  roomSlug,
  widgets,
}: Props) {
  const profileWidgetRef = useRef<HTMLDivElement>(null);
  const queueWidgetRef = useRef<HTMLDivElement>(null);
  const chatWidgetRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.widgetLayer}>
      {widgets.profile.isOpen ? (
        <div
          className={styles.widget}
          onMouseDown={() => onActivateWidget("profile")}
          style={{
            ...widgets.profile.placementStyle,
            zIndex: widgets.profile.zIndex,
          }}
        >
          <Draggable
            bounds={widgets.profile.bounds}
            defaultPosition={widgets.profile.offset}
            handle="[data-drag-handle='true']"
            nodeRef={profileWidgetRef}
            onStop={(_, data) => onWidgetStop("profile", data)}
          >
            <div ref={profileWidgetRef} className={styles.widgetFrame}>
              <FloatingRoomPanelShell
                contentClassName={styles.profilePanelContent}
                height={widgets.profile.height}
                width={widgets.profile.width}
              >
                <RoomProfilePanel
                  currentRequester={currentRequester}
                  currentTrackTitle={currentTrackTitle}
                />
              </FloatingRoomPanelShell>
            </div>
          </Draggable>
        </div>
      ) : null}
      {widgets.queue.isOpen ? (
        <div
          className={styles.widget}
          onMouseDown={() => onActivateWidget("queue")}
          style={{
            ...widgets.queue.placementStyle,
            zIndex: widgets.queue.zIndex,
          }}
        >
          <Draggable
            bounds={widgets.queue.bounds}
            defaultPosition={widgets.queue.offset}
            handle="[data-drag-handle='true']"
            nodeRef={queueWidgetRef}
            onStop={(_, data) => onWidgetStop("queue", data)}
          >
            <div ref={queueWidgetRef} className={styles.widgetFrame}>
              <FloatingRoomPanelShell
                contentClassName={styles.queuePanelContent}
                height={widgets.queue.height}
                width={widgets.queue.width}
              >
                <RoomQueuePanel
                  roomPassword={roomPassword}
                  roomSlug={roomSlug}
                />
              </FloatingRoomPanelShell>
            </div>
          </Draggable>
        </div>
      ) : null}
      {widgets.chat.isOpen ? (
        <div
          className={styles.widget}
          onMouseDown={() => onActivateWidget("chat")}
          style={{
            ...widgets.chat.placementStyle,
            zIndex: widgets.chat.zIndex,
          }}
        >
          <Draggable
            bounds={widgets.chat.bounds}
            defaultPosition={widgets.chat.offset}
            handle="[data-drag-handle='true']"
            nodeRef={chatWidgetRef}
            onStop={(_, data) => onWidgetStop("chat", data)}
          >
            <div ref={chatWidgetRef} className={styles.widgetFrame}>
              <FloatingRoomPanelShell
                height={widgets.chat.height}
                width={widgets.chat.width}
              >
                <div className={styles.widgetPlaceholder}>
                  채팅 모달입니다. (개발중)
                </div>
              </FloatingRoomPanelShell>
            </div>
          </Draggable>
        </div>
      ) : null}
    </div>
  );
}
