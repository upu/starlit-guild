"use client";
import { useStudyPlayer } from "../study-player";
import { teaStudy } from "@/lib/home-tea-study";
export function useTeaPlayer() {
  return useStudyPlayer(teaStudy.duration);
}
