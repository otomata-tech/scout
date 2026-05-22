<script setup lang="ts">
import type { NavItem, BrandingConfig } from "../core/types";
import SidebarNav from "./SidebarNav.vue";
import Header from "./Header.vue";

defineProps<{
  navItems: NavItem[];
  branding: BrandingConfig;
  pageTitle?: string;
  pageSubtitle?: string;
}>();
</script>

<template>
  <div class="min-h-screen flex bg-background text-foreground">
    <SidebarNav :items="navItems" :branding="branding">
      <template #footer>
        <slot name="sidebar-footer" />
      </template>
    </SidebarNav>

    <div class="flex-1 flex flex-col min-w-0">
      <Header :title="pageTitle" :subtitle="pageSubtitle">
        <template #actions>
          <slot name="header-actions" />
        </template>
      </Header>
      <main class="flex-1 overflow-y-auto">
        <div class="max-w-7xl mx-auto px-6 py-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
