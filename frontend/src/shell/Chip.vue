<script setup lang="ts">
defineProps<{
  /** Visual variant. */
  kind?: "default" | "hot" | "warm" | "cold" | "ok" | "bad" | "mock";
  /** Hide the leading dot (some chips don't need it). */
  noDot?: boolean;
}>();
</script>

<template>
  <span :class="['chip', kind]">
    <span v-if="!noDot" class="dot" />
    <slot />
  </span>
</template>
