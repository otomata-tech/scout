<script setup lang="ts">
import { Icon } from "./Icons";

defineProps<{
  /** Mission display name (left-most crumb) */
  missionName?: string;
  /** Trailing breadcrumbs (last one is highlighted) */
  breadcrumbs?: string[];
  /** Optional command bar placeholder (⌘K). Hidden when empty. */
  searchPlaceholder?: string;
}>();

defineEmits<{ "toggle-sidebar": [] }>();
</script>

<template>
  <header class="scout-head">
    <button class="scout-burger" @click="$emit('toggle-sidebar')" aria-label="Menu">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div class="crumbs">
      <span v-if="missionName">{{ missionName }}</span>
      <template v-for="(b, i) in breadcrumbs ?? []" :key="i">
        <span>/</span>
        <span :class="i === (breadcrumbs?.length ?? 0) - 1 ? 'here' : ''">{{ b }}</span>
      </template>
    </div>

    <div v-if="searchPlaceholder !== ''" class="cmdbar">
      <Icon name="search" />
      <span>{{ searchPlaceholder ?? "Search…" }}</span>
      <span class="kbd">⌘ K</span>
    </div>

    <div class="actions">
      <slot />
    </div>
  </header>
</template>
