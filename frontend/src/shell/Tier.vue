<script setup lang="ts">
import Chip from "./Chip.vue";
import { formatNumber } from "../lib/utils";

defineProps<{
  name: string;
  count: number;
  description: string;
  heat?: "hot" | "warm" | "cold";
  /** Roman numeral marker for ordering (i, ii, iii, iv…). */
  roman?: string;
  /** CTA label shown on hover. */
  cta?: string;
}>();

defineEmits<{ click: [] }>();

function heatLabel(h?: string): string {
  if (h === "hot") return "call first";
  if (h === "warm") return "pitch contextuel";
  if (h === "cold") return "cold revival";
  return "";
}
</script>

<template>
  <button class="tier" @click="$emit('click')">
    <div class="top">
      <div class="name">{{ name }}</div>
      <div class="num">{{ formatNumber(count) }}</div>
    </div>
    <div class="desc">{{ description }}</div>
    <div style="display:flex; align-items:center; justify-content:space-between;">
      <Chip v-if="heat" :kind="heat">{{ heatLabel(heat) }}</Chip>
      <span v-else />
      <div class="cta">{{ cta ?? "voir ces deals →" }}</div>
    </div>
    <div v-if="roman" class="roman">{{ roman }}</div>
  </button>
</template>
