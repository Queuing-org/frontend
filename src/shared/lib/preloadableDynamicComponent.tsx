"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export type ComponentPreloader = () => Promise<unknown>;

export function createRetryablePreloader<Module>(
  loader: () => Promise<Module>,
) {
  let activeLoad: Promise<Module> | null = null;

  return () => {
    if (!activeLoad) {
      activeLoad = loader().catch((error: unknown) => {
        activeLoad = null;
        throw error;
      });
    }

    return activeLoad;
  };
}

export function createPreloadableDynamicComponent<Props>(
  loader: () => Promise<{ default: ComponentType<Props> }>,
) {
  const preload = createRetryablePreloader(loader);
  const Component = dynamic<Props>(() => preload(), {
    loading: () => null,
    ssr: false,
  });

  return { Component, preload };
}

export function requestComponentPreload(preload: ComponentPreloader) {
  void preload().catch(() => undefined);
}

export function runAfterComponentPreload(
  preload: ComponentPreloader,
  onReady: () => void,
  onError: (error: unknown) => void,
) {
  void preload().then(onReady, onError);
}
