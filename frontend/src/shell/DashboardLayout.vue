<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { MissionConfig } from "../core/types";
import SidebarNav from "./SidebarNav.vue";
import Header from "./Header.vue";

defineProps<{
  mission: MissionConfig;
  breadcrumbs?: string[];
  searchPlaceholder?: string;
}>();

const sidebarOpen = ref(false);
const route = useRoute();

watch(() => route.path, () => { sidebarOpen.value = false; });
</script>

<template>
  <div class="scout-app" :class="{ 'sidebar-open': sidebarOpen }">
    <div class="scout-overlay" @click="sidebarOpen = false" />
    <SidebarNav :items="mission.navItems" :branding="mission.branding">
      <template #switcher>
        <slot name="sidebar-switcher" />
      </template>
      <template #footer>
        <slot name="sidebar-footer">
          <div><span class="dot" />zoho · cache 10 min</div>
          <div class="mono">v0.3</div>
        </slot>
      </template>
    </SidebarNav>

    <div class="scout-main">
      <Header
        :mission-name="mission.branding.logoText"
        :breadcrumbs="breadcrumbs"
        :search-placeholder="searchPlaceholder"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
      >
        <slot name="header-actions" />
      </Header>
      <div class="scout-content">
        <slot />
      </div>
    </div>
  </div>
</template>
