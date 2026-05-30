<script setup lang="ts">
import { ref, onMounted } from "vue";
import SectionH from "@/shell/SectionH.vue";
import DataTable, { type ColumnDef } from "@/shell/DataTable.vue";
import { adminApi, type ApiTokenRow } from "../api";

const tokens = ref<ApiTokenRow[]>([]);
const loading = ref(false);
const newName = ref("");
const freshToken = ref<string | null>(null);

const columns: ColumnDef<ApiTokenRow>[] = [
  { key: "name", label: "Nom" },
  { key: "createdAt", label: "Créé", width: "170px", cellClass: "mono mute", format: (r) => r.createdAt.slice(0, 16) },
  { key: "lastUsedAt", label: "Dernier usage", width: "170px", cellClass: "mono mute", format: (r) => r.lastUsedAt?.slice(0, 16) ?? "—" },
  { key: "revokedAt", label: "État", width: "110px", format: (r) => (r.revokedAt ? "révoqué" : "actif") },
];

async function load() {
  loading.value = true;
  try {
    tokens.value = await adminApi.tokens();
  } finally {
    loading.value = false;
  }
}

async function create() {
  if (!newName.value.trim()) return;
  const res = await adminApi.createToken(newName.value.trim());
  freshToken.value = res.token;
  newName.value = "";
  await load();
}

async function revoke(row: ApiTokenRow) {
  if (row.revokedAt) return;
  if (!confirm(`Révoquer le token "${row.name}" ?`)) return;
  await adminApi.revokeToken(row.id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="page">
    <SectionH title="API tokens" subtitle="Tokens personnels pour l'accès programmatique / MCP" />

    <div class="toolbar">
      <input v-model="newName" placeholder="Nom du token…" @keyup.enter="create" />
      <button @click="create">+ Générer</button>
    </div>

    <div v-if="freshToken" class="fresh">
      <strong>Nouveau token</strong> — copiez-le, il ne sera plus affiché :
      <code>{{ freshToken }}</code>
      <button class="dismiss" @click="freshToken = null">×</button>
    </div>

    <DataTable
      :columns="columns"
      :rows="tokens"
      :row-key="(r) => String(r.id)"
      :loading="loading"
      empty-message="Aucun token."
      @row-click="revoke"
    />
    <p class="hint">Cliquez sur une ligne active pour la révoquer.</p>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.toolbar { display: flex; gap: 0.5rem; }
.toolbar input { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid var(--scout-hair); border-radius: 8px; background: var(--scout-surface); color: var(--scout-ink); }
.toolbar button { padding: 0.4rem 0.8rem; border: none; border-radius: 8px; cursor: pointer; background: var(--scout-primary); color: var(--scout-primary-foreground, white); }
.fresh { display: flex; gap: 0.5rem; align-items: center; padding: 0.6rem 0.8rem; border: 1px solid var(--scout-hair); border-radius: 8px; background: var(--scout-surface-2); }
.fresh code { font-family: var(--scout-font-mono, monospace); word-break: break-all; flex: 1; }
.fresh .dismiss { border: none; background: transparent; cursor: pointer; font-size: 1.2rem; color: var(--scout-mute); }
.hint { color: var(--scout-mute); font-size: 0.85rem; }
</style>
