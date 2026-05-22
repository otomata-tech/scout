<script setup lang="ts">
defineProps<{
  label: string;
  value: number;
  max: number;
  format?: (v: number) => string;
  /** Visual variant for the bar fill. Maps to heat scale or default brand. */
  variant?: "default" | "warm" | "hot" | "cold" | "ok";
}>();
</script>

<template>
  <div :class="['row', variant]">
    <div class="lbl">{{ label }}</div>
    <div class="track">
      <div
        class="fill"
        :style="{ width: `${Math.max(2, (value / Math.max(1, max)) * 100)}%` }"
      />
    </div>
    <div class="v">{{ format ? format(value) : value.toLocaleString("fr-FR") }}</div>
  </div>
</template>
