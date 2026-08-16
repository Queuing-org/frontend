"use client";

import { useRef } from "react";
import Draggable from "react-draggable";
import type { DraggableData } from "react-draggable";
import type {
  FloatingWidgetsView,
  WidgetId,
} from "@/src/features/room/floating/model/useFloatingWidgetsState";
import type {
  PlaylistEntry,
  PlaylistParticipant,
} from "@/src/features/playlist/model/types";
import type { ChatMessage, RoomMeta } from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import type { CurrentRequesterProfile } from "@/src/features/room/profile/model/types";
import RoomProfilePanel from "@/src/features/room/profile/ui/RoomProfilePanel";
import RoomQueuePanel from "@/src/features/room/queue/ui/RoomQueuePanel";
import RoomParticipantsPanel from "@/src/features/room/participants/ui/RoomParticipantsPanel";
import { getParticipantKickTargetForUser } from "@/src/features/room/participants/model/participantIdentity";
import type { ResolveRoomParticipantByUserSlug } from "@/src/features/room/participants/model/roomParticipantPaging";
import RoomChatComposer from "@/src/features/room/chat/ui/RoomChatComposer";
import FloatingPanelShell from "@/src/shared/ui/floating-panel/FloatingPanelShell";
import styles from "./RoomFloatingWidgets.module.css";

type Props = {
  chatMessages: readonly ChatMessage[];
  chatDisabledReason?: string;
  chatErrorMessage?: string;
  currentRequester: CurrentRequesterProfile | null;
  currentEntry?: PlaylistEntry | null;
  currentTrackTitle?: string | null;
  currentUser: User | null;
  hasNextParticipantsPage: boolean;
  isChatSending: boolean;
  isCurrentUserLoading: boolean;
  isFetchingNextParticipantsPage: boolean;
  isParticipantsLoadMoreError: boolean;
  onLoadMoreParticipants: () => Promise<unknown>;
  onChatLoginClick?: () => void;
  onUserBlocked: (userSlug: string) => void;
  onSendChatMessage: (message: string) => boolean;
  onActivateWidget: (widgetId: WidgetId) => void;
  onWidgetStop: (widgetId: WidgetId, data: DraggableData) => void;
  participants: PlaylistParticipant[];
  reportMessageKey?: string | null;
  resolveParticipantByUserSlug: ResolveRoomParticipantByUserSlug;
  roomMeta: RoomMeta | null;
  roomPassword?: string | null;
  roomSlug: string;
  widgets: FloatingWidgetsView;
};

export default function RoomFloatingWidgets({
  chatMessages,
  chatDisabledReason,
  chatErrorMessage,
  currentRequester,
  currentEntry,
  currentTrackTitle,
  currentUser,
  hasNextParticipantsPage,
  isChatSending,
  isCurrentUserLoading,
  isFetchingNextParticipantsPage,
  isParticipantsLoadMoreError,
  onLoadMoreParticipants,
  onChatLoginClick,
  onUserBlocked,
  onSendChatMessage,
  onActivateWidget,
  onWidgetStop,
  participants,
  reportMessageKey,
  resolveParticipantByUserSlug,
  roomMeta,
  roomPassword,
  roomSlug,
  widgets,
}: Props) {
  const profileWidgetRef = useRef<HTMLDivElement>(null);
  const queueWidgetRef = useRef<HTMLDivElement>(null);
  const chatWidgetRef = useRef<HTMLDivElement>(null);
  const participantsWidgetRef = useRef<HTMLDivElement>(null);
  const currentRequesterKickTarget = getParticipantKickTargetForUser(
    participants,
    currentRequester,
  );

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
            key={widgets.profile.layoutKey}
            bounds={widgets.profile.bounds}
            defaultPosition={widgets.profile.offset}
            handle="[data-drag-handle='true']"
            nodeRef={profileWidgetRef}
            onStop={(_, data) => onWidgetStop("profile", data)}
          >
            <div ref={profileWidgetRef} className={styles.widgetFrame}>
              <FloatingPanelShell
                contentClassName={styles.profilePanelContent}
                height={widgets.profile.height}
                width={widgets.profile.width}
              >
                <RoomProfilePanel
                  currentUser={currentUser}
                  currentRequester={currentRequester}
                  currentEntryId={currentEntry?.entryId}
                  currentTrackTitle={currentTrackTitle}
                  isCurrentUserLoading={isCurrentUserLoading}
                  hasUnloadedParticipants={hasNextParticipantsPage}
                  kickTarget={currentRequesterKickTarget}
                  onUserBlocked={onUserBlocked}
                  reportMessageKey={reportMessageKey}
                  roomMeta={roomMeta}
                  roomPassword={roomPassword}
                  roomSlug={roomSlug}
                  resolveParticipantByUserSlug={
                    resolveParticipantByUserSlug
                  }
                />
              </FloatingPanelShell>
            </div>
          </Draggable>
        </div>
      ) : null}
      {widgets.participants.isOpen ? (
        <div
          className={styles.widget}
          onMouseDown={() => onActivateWidget("participants")}
          style={{
            ...widgets.participants.placementStyle,
            zIndex: widgets.participants.zIndex,
          }}
        >
          <Draggable
            key={widgets.participants.layoutKey}
            bounds={widgets.participants.bounds}
            defaultPosition={widgets.participants.offset}
            handle="[data-drag-handle='true']"
            nodeRef={participantsWidgetRef}
            onStop={(_, data) => onWidgetStop("participants", data)}
          >
            <div ref={participantsWidgetRef} className={styles.widgetFrame}>
              <FloatingPanelShell
                contentClassName={styles.participantsPanelContent}
                density={widgets.participants.density}
                height={widgets.participants.height}
                width={widgets.participants.width}
              >
                <RoomParticipantsPanel
                  chatMessages={chatMessages}
                  currentUser={currentUser}
                  hasNextPage={hasNextParticipantsPage}
                  isFetchingNextPage={isFetchingNextParticipantsPage}
                  isLoadMoreError={isParticipantsLoadMoreError}
                  onLoadMore={onLoadMoreParticipants}
                  onUserBlocked={onUserBlocked}
                  participants={participants}
                  roomMeta={roomMeta}
                  roomPassword={roomPassword}
                  roomSlug={roomSlug}
                />
              </FloatingPanelShell>
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
            key={widgets.queue.layoutKey}
            bounds={widgets.queue.bounds}
            defaultPosition={widgets.queue.offset}
            handle="[data-drag-handle='true']"
            nodeRef={queueWidgetRef}
            onStop={(_, data) => onWidgetStop("queue", data)}
          >
            <div ref={queueWidgetRef} className={styles.widgetFrame}>
              <FloatingPanelShell
                contentClassName={styles.queuePanelContent}
                height={widgets.queue.height}
                width={widgets.queue.width}
              >
                <RoomQueuePanel
                  currentEntry={currentEntry}
                  currentUser={currentUser}
                  isCurrentUserLoading={isCurrentUserLoading}
                  roomMeta={roomMeta}
                  roomPassword={roomPassword}
                  roomSlug={roomSlug}
                />
              </FloatingPanelShell>
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
            key={widgets.chat.layoutKey}
            bounds={widgets.chat.bounds}
            defaultPosition={widgets.chat.offset}
            handle="[data-drag-handle='true']"
            nodeRef={chatWidgetRef}
            onStop={(_, data) => onWidgetStop("chat", data)}
          >
            <div ref={chatWidgetRef} className={styles.widgetFrame}>
              <FloatingPanelShell
                compactHeader
                contentClassName={styles.chatPanelContent}
                height={widgets.chat.height}
                width={widgets.chat.width}
              >
                <RoomChatComposer
                  disabledReason={chatDisabledReason}
                  errorMessage={chatErrorMessage}
                  isSending={isChatSending}
                  onLoginClick={onChatLoginClick}
                  onSendMessage={onSendChatMessage}
                  showLoginAction={Boolean(onChatLoginClick)}
                />
              </FloatingPanelShell>
            </div>
          </Draggable>
        </div>
      ) : null}
    </div>
  );
}
