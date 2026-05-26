<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import type { MissionConfig } from "../core/types";
import DashboardLayout from "./DashboardLayout.vue";

const props = defineProps<{ mission: MissionConfig }>();
const route = useRoute();

/**
 * Build breadcrumbs from the current route.
 * Missions can override via their own pages, but this gives a sensible default.
 */
const crumbs = computed<string[]>(() => {
  const allItems = props.mission.navSections?.flatMap((s) => s.items) ?? props.mission.navItems ?? [];
  const match = allItems.find((n) => {
    if (n.path === "/") return route.path === "/";
    return route.path.startsWith(n.path);
  });
  const base = match?.label ?? route.name?.toString() ?? "";
  if (route.params.id) return [base, `#${route.params.id}`];
  if (route.params.siren) return [base, `${route.params.siren}`];
  return [base];
});
</script>

<template>
  <DashboardLayout
    :mission="mission"
    :breadcrumbs="crumbs"
    search-placeholder="Search deals, accounts, contacts…"
  >
    <template #sidebar-switcher>
      <slot name="sidebar-switcher" />
    </template>
    <template #sidebar-footer>
      <slot name="sidebar-footer" />
    </template>
    <template #header-actions>
      <slot name="header-actions" />
    </template>
    <RouterView />
  </DashboardLayout>
</template>
