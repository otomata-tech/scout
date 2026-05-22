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
</script>

<template>
  <header class="scout-head">
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
