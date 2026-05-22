<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  /** Tonal accent for the big number. */
  tone?: "primary" | "accent" | "warm" | "hot";
  /** Delta indicator ({ dir: 'up' | 'dn', text: '+8% / mois' }). */
  delta?: { dir: "up" | "dn"; text: string };
  /** Tiny sparkline data (0..1 per bar, ~8 bars). */
  spark?: number[];
}>();
</script>

<template>
  <div class="kpi">
    <div class="label">{{ label }}</div>
    <div :class="['v', tone]">{{ value }}</div>
    <div
      v-if="hint || delta"
      style="display:flex; align-items:baseline; justify-content:space-between; gap:8px;"
    >
      <span v-if="hint" class="hint">{{ hint }}</span>
      <span v-if="delta" :class="['delta', delta.dir]">
        {{ delta.dir === "up" ? "↑" : "↓" }} {{ delta.text }}
      </span>
    </div>
    <div v-if="spark && spark.length" class="spark">
      <i v-for="(h, i) in spark" :key="i" :style="{ height: `${h * 100}%` }" />
    </div>
  </div>
</template>
