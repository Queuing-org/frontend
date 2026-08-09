"use client";

import type { FollowModalProps } from "@/src/features/follow/ui/FollowModal";
import type { RoomFormModalProps } from "@/src/features/room/create/ui/RoomFormModal";
import type { SettingsModalProps } from "@/src/features/settings/ui/SettingsModal";
import type { HomeMenuItem } from "@/src/features/room/discovery/ui/HomeControlPanelShell";
import {
  createPreloadableDynamicComponent,
  requestComponentPreload,
  type ComponentPreloader,
} from "@/src/shared/lib/preloadableDynamicComponent";

export type DiscoveryModalKey = "create" | "follow" | "settings";

export const discoveryModalResources = {
  create: createPreloadableDynamicComponent<RoomFormModalProps>(() =>
    import("@/src/features/room/create/ui/RoomFormModal"),
  ),
  follow: createPreloadableDynamicComponent<FollowModalProps>(() =>
    import("@/src/features/follow/ui/FollowModal"),
  ),
  settings: createPreloadableDynamicComponent<SettingsModalProps>(() =>
    import("@/src/features/settings/ui/SettingsModal"),
  ),
} as const;

export const DISCOVERY_MODAL_PRELOADERS = [
  discoveryModalResources.create.preload,
  discoveryModalResources.follow.preload,
  discoveryModalResources.settings.preload,
] as const;

const preloaderByMenuItem: Partial<
  Record<HomeMenuItem, (typeof DISCOVERY_MODAL_PRELOADERS)[number]>
> = {
  CREATE: discoveryModalResources.create.preload,
  FOLLOW: discoveryModalResources.follow.preload,
  SETTING: discoveryModalResources.settings.preload,
};

export function getDiscoveryModalPreloader(
  modalKey: DiscoveryModalKey,
): ComponentPreloader {
  return discoveryModalResources[modalKey].preload;
}

export function preloadDiscoveryModalForMenuItem(item: HomeMenuItem) {
  const preloader = preloaderByMenuItem[item];

  if (preloader) {
    requestComponentPreload(preloader);
  }
}
