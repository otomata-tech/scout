<script setup lang="ts">
import { cn } from "../lib/utils";

defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  emphasis?: "primary" | "muted" | "accent" | "destructive";
}>();
</script>

<template>
  <div
    :class="cn(
      'rounded-lg border bg-card p-4 transition-colors',
      emphasis === 'primary' && 'border-primary/40',
      emphasis === 'accent' && 'border-accent/60',
      emphasis === 'destructive' && 'border-destructive/40',
      !emphasis && 'border-border'
    )"
  >
    <div class="text-[11px] uppercase tracking-wider text-muted-foreground">{{ label }}</div>
    <div
      :class="cn(
        'text-2xl font-mono mt-1 tabular-nums',
        emphasis === 'primary' && 'text-primary',
        emphasis === 'accent' && 'text-accent',
        emphasis === 'destructive' && 'text-destructive'
      )"
    >
      {{ value }}
    </div>
    <div v-if="hint" class="text-xs text-muted-foreground mt-1">{{ hint }}</div>
  </div>
</template>
