<script setup lang="ts">
export interface TimelineEntry {
  when: string;
  /** Visual emphasis for the dot. */
  heat?: "hot" | "warm" | "";
  /** Plain text content. For richer markup, use the default slot per-entry. */
  what?: string;
}

defineProps<{ entries: TimelineEntry[] }>();
</script>

<template>
  <div class="timeline">
    <div
      v-for="(t, i) in entries"
      :key="i"
      :class="['t', t.heat ?? '']"
    >
      <div class="when">{{ t.when }}</div>
      <div class="what">
        <slot :entry="t" :index="i">{{ t.what }}</slot>
      </div>
    </div>
  </div>
</template>
