<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <div class="grp">
    <span class="lbl">{{ label }}</span>
    <slot />
  </div>
</template>
