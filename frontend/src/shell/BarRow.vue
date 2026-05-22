<script setup lang="ts">
import { cn } from "../lib/utils";

defineProps<{
  label: string;
  value: number;
  max: number;
  format?: (v: number) => string;
  variant?: "default" | "accent" | "success" | "muted";
}>();
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="w-48 text-sm shrink-0 truncate text-foreground">{{ label }}</div>
    <div class="flex-1 h-5 bg-muted rounded overflow-hidden">
      <div
        :class="cn(
          'h-full transition-all',
          variant === 'accent' && 'bg-accent',
          variant === 'success' && 'bg-success/30',
          variant === 'muted' && 'bg-muted-foreground/30',
          (!variant || variant === 'default') && 'bg-primary/30'
        )"
        :style="{ width: `${Math.max(2, (value / max) * 100)}%` }"
      />
    </div>
    <div class="font-mono text-sm text-muted-foreground w-20 text-right tabular-nums">
      {{ format ? format(value) : value }}
    </div>
  </div>
</template>
