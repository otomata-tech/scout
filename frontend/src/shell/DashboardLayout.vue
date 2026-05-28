<script setup lang="ts">
import type { MissionConfig } from "../core/types";
import SidebarNav from "./SidebarNav.vue";
import Header from "./Header.vue";

defineProps<{
  mission: MissionConfig;
  breadcrumbs?: string[];
  searchPlaceholder?: string;
}>();

const emit = defineEmits<{ (e: "open-search"): void }>();
</script>

<template>
  <div class="scout-app">
    <SidebarNav :items="mission.navItems" :sections="mission.navSections" :branding="mission.branding" :footer-component="mission.sidebarFooter">
      <template #switcher>
        <slot name="sidebar-switcher" />
      </template>
      <template #footer>
        <slot name="sidebar-footer" />
      </template>
    </SidebarNav>

    <div class="scout-main">
      <Header
        :mission-name="mission.branding.logoText"
        :breadcrumbs="breadcrumbs"
        :search-placeholder="searchPlaceholder"
        @open-search="emit('open-search')"
      >
        <slot name="header-actions" />
      </Header>
      <div class="scout-content">
        <slot />
      </div>
    </div>
  </div>
</template>
