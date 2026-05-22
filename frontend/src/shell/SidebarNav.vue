<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import type { NavItem, BrandingConfig } from "../core/types";
import { Icon } from "./Icons";

const props = defineProps<{
  items: NavItem[];
  branding: BrandingConfig;
  /** Optional secondary section shown below the primary nav */
  secondary?: { label: string; items: NavItem[] };
}>();

const route = useRoute();

const initials = props.branding.logoText
  ? props.branding.logoText.slice(0, 1).toUpperCase()
  : "S";

const isActive = (path: string) => {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
};
</script>

<template>
  <aside class="scout-side">
    <div class="brand">
      <div class="glyph">{{ initials }}</div>
      <div class="meta">
        <div class="name">{{ branding.logoText ?? "scout" }}</div>
        <div v-if="branding.subtitle" class="sub">{{ branding.subtitle }}</div>
      </div>
    </div>

    <slot name="switcher" />

    <nav>
      <div class="section-label">Pipeline</div>
      <RouterLink
        v-for="item in items"
        :key="item.path"
        :to="item.path"
        custom
        v-slot="{ navigate }"
      >
        <a
          :class="isActive(item.path) ? 'active' : ''"
          @click="navigate"
        >
          <Icon v-if="item.icon" :name="item.icon" />
          <span class="lbl">{{ item.label }}</span>
          <span v-if="item.badge != null" class="badge">{{ item.badge }}</span>
        </a>
      </RouterLink>

      <template v-if="secondary">
        <div class="section-label">{{ secondary.label }}</div>
        <RouterLink
          v-for="item in secondary.items"
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
      <slot name="footer">
        <div><span class="dot" />live</div>
      </slot>
    </div>
  </aside>
</template>
