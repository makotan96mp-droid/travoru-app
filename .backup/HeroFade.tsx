"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { PropsWithChildren } from "react";

export default function HeroFade({ children }: PropsWithChildren) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]); // 0〜300pxのスクロールで 1→0
  return (
    <motion.section
      style={{ opacity }}
      className="relative z-10 min-h-[80vh] flex items-center"
    >
      {children}
    </motion.section>
  );
}
