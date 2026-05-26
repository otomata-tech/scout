<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import type { Component } from "vue";
import type { NavItem, NavSection, BrandingConfig } from "../core/types";
import { Icon } from "./Icons";

const props = defineProps<{
  items?: NavItem[];
  sections?: NavSection[];
  branding: BrandingConfig;
  footerComponent?: Component;
}>();

const route = useRoute();
const open = ref(false);

watch(() => route.path, () => { open.value = false; });

const initials = props.branding.logoText
  ? props.branding.logoText.slice(0, 1).toUpperCase()
  : "S";

const isActive = (path: string) => {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
};

const resolvedSections = computed<NavSection[]>(() => {
  if (props.sections?.length) return props.sections;
  if (props.items?.length) return [{ label: "Pipeline", items: props.items }];
  return [];
});
</script>

<template>
  <button class="scout-hamburger" @click="open = !open" aria-label="Menu">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
  </button>
  <div v-if="open" class="scout-side-overlay" @click="open = false" />
  <aside :class="['scout-side', { open }]">
    <div class="brand">
      <template v-if="branding.logoUrl">
        <img :src="branding.logoUrl" :alt="branding.logoText ?? 'logo'" class="brand-logo" />
        <div v-if="branding.subtitle" class="sub" style="margin-left: auto; font-size: 10px;">{{ branding.subtitle }}</div>
      </template>
      <template v-else>
        <div class="glyph">{{ initials }}</div>
        <div class="meta">
          <div class="name">{{ branding.logoText ?? "scout" }}</div>
          <div v-if="branding.subtitle" class="sub">{{ branding.subtitle }}</div>
        </div>
      </template>
    </div>

    <slot name="switcher" />

    <nav>
      <template v-for="(section, i) in resolvedSections" :key="i">
        <div class="section-label">{{ section.label }}</div>
        <RouterLink
          v-for="item in section.items"
          :key="item.path"
          :to="item.path"
          custom
          v-slot="{ navigate }"
        >
          <a :class="isActive(item.path) ? 'active' : ''" @click="navigate">
            <Icon v-if="item.icon" :name="item.icon" />
            <span class="lbl">{{ item.label }}</span>
            <span v-if="item.badge != null" class="badge">{{ item.badge }}</span>
          </a>
        </RouterLink>
      </template>
    </nav>

    <div class="foot">
      <component v-if="footerComponent" :is="footerComponent" />
      <slot v-else name="footer" />
    </div>
  </aside>
</template>
