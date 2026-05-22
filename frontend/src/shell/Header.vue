<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
}>();
</script>

<template>
  <header class="h-14 px-6 border-b border-border bg-background flex items-center justify-between gap-4">
    <div class="min-w-0">
      <h1 v-if="title" class="text-base font-semibold tracking-tight truncate">{{ title }}</h1>
      <p v-if="subtitle" class="text-xs text-muted-foreground truncate">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>
