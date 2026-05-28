<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterView, useRoute } from "vue-router";
import type { MissionConfig } from "../core/types";
import DashboardLayout from "./DashboardLayout.vue";
import CommandPalette from "./CommandPalette.vue";

const props = defineProps<{ mission: MissionConfig }>();
const route = useRoute();

/** The command bar only appears when the mission wires up a search provider. */
const searchPlaceholder = computed(() =>
  props.mission.search ? "Rechercher deals, comptes, contacts…" : "",
);

const paletteOpen = ref(false);

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
    if (!props.mission.search) return;
    e.preventDefault();
    paletteOpen.value = !paletteOpen.value;
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));

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
    :search-placeholder="searchPlaceholder"
    @open-search="paletteOpen = true"
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

  <CommandPalette
    v-if="mission.search"
    :open="paletteOpen"
    :provider="mission.search"
    :placeholder="searchPlaceholder"
    @close="paletteOpen = false"
  />
</template>
