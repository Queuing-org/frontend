"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Ssgoi } from "@ssgoi/react";
import { blind, fade } from "@ssgoi/react/view-transitions";

const ssgoiConfig = {
  // defaultTransition: fade({
  //   physics: {
  //     spring: {
  //       stiffness: 500, // 스프링 강도: 높을수록 더 빠르고 강하게 움직임
  //       damping: 40, // 감쇠: 높을수록 덜 튀고 더 빨리 안정됨
  //     },
  //   },
  // }),
};

export default function SsgoiProvider({ children }: { children: ReactNode }) {
  return (
    <Ssgoi config={ssgoiConfig} usePathname={usePathname}>
      {children}
    </Ssgoi>
  );
}
