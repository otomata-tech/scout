<script setup lang="ts">
import { RouterView } from "vue-router";
import type { MissionConfig } from "../core/types";
import DashboardLayout from "./DashboardLayout.vue";

defineProps<{ mission: MissionConfig }>();
</script>

<template>
  <DashboardLayout
    :nav-items="mission.navItems"
    :branding="mission.branding"
  >
    <template #header-actions>
      <slot name="header-actions" />
    </template>
    <RouterView />
  </DashboardLayout>
</template>
