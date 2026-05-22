<script setup lang="ts">
import { cn, ageLabel } from "../lib/utils";

defineProps<{
  hit?: boolean;
  ageSeconds?: number;
  loading?: boolean;
}>();

defineEmits<{ refresh: [] }>();
</script>

<template>
  <div class="flex items-center gap-3 text-xs">
    <span v-if="ageSeconds != null" class="font-mono text-muted-foreground">
      <span :class="cn(hit ? 'text-success' : 'text-warning')">●</span>
      data {{ ageLabel(ageSeconds) }}
    </span>
    <button
      type="button"
      :disabled="loading"
      @click="$emit('refresh')"
      class="px-2.5 py-1 rounded border border-border bg-card hover:bg-accent disabled:opacity-40 transition-colors"
    >{{ loading ? "…" : "Refresh" }}</button>
  </div>
</template>
