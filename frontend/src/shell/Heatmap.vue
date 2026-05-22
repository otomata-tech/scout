<script setup lang="ts">
import { formatNumber } from "../lib/utils";

export interface HeatBucket {
  /** Short label (year, month range, etc.) shown at the bottom. */
  label: string;
  /** Numeric value driving the fill intensity. */
  value: number;
}

const props = defineProps<{
  buckets: HeatBucket[];
}>();

defineEmits<{ "bucket-click": [bucket: HeatBucket] }>();

const max = Math.max(1, ...props.buckets.map((b) => b.value));
</script>

<template>
  <div class="heatrow">
    <div
      v-for="(b, i) in buckets"
      :key="i"
      class="cell"
      :style="{ '--lvl': `${(b.value / max) * 70 + 12}%` }"
      @click="$emit('bucket-click', b)"
    >
      <div class="fill" :style="{ height: `${(b.value / max) * 100}%` }" />
      <div class="n">{{ formatNumber(b.value) }}</div>
      <div class="y">{{ b.label }}</div>
    </div>
  </div>
</template>
