<script setup lang="ts">
import { ref, onMounted } from "vue";
import SectionH from "@/shell/SectionH.vue";
import { adminApi } from "../api";

const content = ref("");
const loading = ref(false);
const saving = ref(false);
const savedAt = ref<string | null>(null);

async function load() {
  loading.value = true;
  try {
    content.value = (await adminApi.getDoctrine()).content;
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!content.value.trim()) return;
  saving.value = true;
  try {
    const res = await adminApi.setDoctrine(content.value);
    savedAt.value = `${new Date().toLocaleTimeString()} · ${res.length} caractères`;
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page">
    <SectionH title="Doctrine MCP" subtitle="Le CLAUDE.md servi aux agents (settings.claude_md)" />
    <textarea v-model="content" :disabled="loading" spellcheck="false" placeholder="# Doctrine…"></textarea>
    <div class="bar">
      <button :disabled="saving || !content.trim()" @click="save">{{ saving ? "Enregistrement…" : "Enregistrer" }}</button>
      <span v-if="savedAt" class="ok">Enregistré — {{ savedAt }}</span>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 0.75rem; height: 100%; }
textarea {
  flex: 1; min-height: 60vh; resize: vertical; padding: 0.75rem;
  border: 1px solid var(--scout-hair); border-radius: 8px;
  background: var(--scout-surface); color: var(--scout-ink);
  font-family: var(--scout-font-mono, monospace); font-size: 0.85rem; line-height: 1.5;
}
.bar { display: flex; gap: 0.75rem; align-items: center; }
.bar button { padding: 0.45rem 1rem; border: none; border-radius: 8px; cursor: pointer; background: var(--scout-primary); color: var(--scout-primary-foreground, white); }
.bar button:disabled { opacity: 0.5; cursor: default; }
.ok { color: var(--scout-mute); font-size: 0.85rem; }
</style>
