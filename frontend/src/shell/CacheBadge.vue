<script setup lang="ts">
import { Icon } from "./Icons";
import { ageLabel } from "../lib/utils";

defineProps<{
  hit?: boolean;
  ageSeconds?: number;
  loading?: boolean;
}>();

defineEmits<{ refresh: [] }>();
</script>

<template>
  <div class="sync" style="display:flex; align-items:center; gap:8px;">
    <span v-if="ageSeconds != null" :class="hit ? 'ok' : 'warn'" style="font-family: var(--scout-font-mono); font-size: 12px;">
      ● data {{ ageLabel(ageSeconds) }}
    </span>
    <button class="btn btn-ghost btn-sm" :disabled="loading" @click="$emit('refresh')">
      <Icon name="refresh" />
      <span>{{ loading ? "syncing…" : "Refresh" }}</span>
    </button>
  </div>
</template>
