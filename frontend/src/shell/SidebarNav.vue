<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import * as LucideIcons from "lucide-vue-next";
import type { NavItem, BrandingConfig } from "../core/types";
import { cn } from "../lib/utils";

const props = defineProps<{
  items: NavItem[];
  branding: BrandingConfig;
}>();

const route = useRoute();

function iconFor(name?: string) {
  if (!name) return null;
  const pascal = name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return (LucideIcons as Record<string, unknown>)[pascal] ?? null;
}

const isActive = (path: string) => {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
};
</script>

<template>
  <aside class="w-60 shrink-0 border-r border-border bg-card flex flex-col">
    <!-- Brand block -->
    <div class="h-14 px-4 flex items-center gap-3 border-b border-border">
      <img v-if="branding.logoUrl" :src="branding.logoUrl" class="h-7 w-7 rounded-sm object-contain" />
      <div>
        <div class="text-sm font-semibold tracking-tight">{{ branding.logoText ?? "scout" }}</div>
        <div v-if="branding.subtitle" class="text-[11px] text-muted-foreground leading-tight">
          {{ branding.subtitle }}
        </div>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 p-3 space-y-0.5">
      <RouterLink
        v-for="item in items"
        :key="item.path"
        :to="item.path"
        :class="cn(
          'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
          isActive(item.path)
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )"
      >
        <component
          v-if="iconFor(item.icon)"
          :is="iconFor(item.icon)"
          class="h-4 w-4 shrink-0"
        />
        <span class="flex-1 truncate">{{ item.label }}</span>
        <span
          v-if="item.badge != null"
          class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
        >{{ item.badge }}</span>
      </RouterLink>
    </nav>

    <!-- Footer slot -->
    <div class="p-3 border-t border-border">
      <slot name="footer" />
    </div>
  </aside>
</template>
