<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { handleCallback, consumePostLoginPath } from "../composables/useAuth";

const router = useRouter();

onMounted(async () => {
  try {
    await handleCallback();
    router.replace(consumePostLoginPath());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Login callback failed", e);
    router.replace("/");
  }
});
</script>

<template>
  <div style="display: grid; place-items: center; height: 100vh; color: var(--scout-mute); font-family: var(--scout-font-mono); font-size: 13px;">
    Finalisation de la connexion…
  </div>
</template>
