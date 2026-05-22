<script setup lang="ts" generic="T extends { label: string; value: number }">
import BarRow from "./BarRow.vue";

defineProps<{
  rows: T[];
  variant?: "default" | "warm" | "hot" | "cold" | "ok";
  format?: (v: number) => string;
}>();

function maxOf<X extends { value: number }>(arr: X[]): number {
  return Math.max(1, ...arr.map((r) => r.value));
}
</script>

<template>
  <div class="barlist">
    <BarRow
      v-for="(r, i) in rows"
      :key="i"
      :label="r.label"
      :value="r.value"
      :max="maxOf(rows)"
      :variant="variant"
      :format="format"
    />
  </div>
</template>
