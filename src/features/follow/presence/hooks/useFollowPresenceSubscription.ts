"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StompSubscription } from "@stomp/stompjs";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import {
  addSocketListener,
  connectSocket,
  getSocketClient,
} from "@/src/shared/api/websocket/stompConnection";
import { followKeys } from "../../model/queryKeys";
import type { FollowListResponse } from "../../model/types";
import { subscribeFollowPresence } from "../api/subscribeFollowPresence";
import {
  applyPresenceToList,
  parseFollowPresenceEvent,
} from "../model/applyFollowPresence";

export function useFollowPresenceSubscription() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (!me) {
      return;
    }

    const cleanupSubscription = () => {
      try {
        subscriptionRef.current?.unsubscribe();
      } catch {
        // A reconnect can invalidate the previous broker subscription.
      }
      subscriptionRef.current = null;
    };

    const subscribeOnce = () => {
      cleanupSubscription();
      subscriptionRef.current = subscribeFollowPresence(({ body }) => {
        const event = parseFollowPresenceEvent(body);
        if (!event) {
          return;
        }

        queryClient.setQueriesData<FollowListResponse>(
          { queryKey: followKeys.followersRoot() },
          (list) => applyPresenceToList(list, event),
        );
        queryClient.setQueriesData<FollowListResponse>(
          { queryKey: followKeys.followingsRoot() },
          (list) => applyPresenceToList(list, event),
        );
      });
    };

    const removeSocketListener = addSocketListener({
      onConnect: subscribeOnce,
    });

    connectSocket();
    if (getSocketClient().connected) {
      subscribeOnce();
    }

    return () => {
      removeSocketListener();
      cleanupSubscription();
    };
  }, [me, queryClient]);
}
