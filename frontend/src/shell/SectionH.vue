<script setup lang="ts">
defineProps<{
  label?: string;
  h?: string;
  right?: string;
}>();
</script>

<template>
  <div class="section-h">
    <div>
      <div v-if="label" class="label">{{ label }}</div>
      <div v-if="h" class="h">{{ h }}</div>
      <slot name="title" />
    </div>
    <div v-if="right || $slots.right" class="right">
      <slot name="right">{{ right }}</slot>
    </div>
  </div>
</template>
