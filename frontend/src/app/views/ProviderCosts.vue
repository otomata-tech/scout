<script setup lang="ts">
import { ref, onMounted } from "vue";
import SectionH from "@/shell/SectionH.vue";
import DataTable, { type ColumnDef } from "@/shell/DataTable.vue";
import { adminApi, type ProviderStat, type ProviderCallRow } from "../api";

const stats = ref<ProviderStat[]>([]);
const recent = ref<ProviderCallRow[]>([]);
const loading = ref(false);

const statCols: ColumnDef<ProviderStat>[] = [
  { key: "provider", label: "Provider" },
  { key: "totalCalls", label: "Appels", align: "right", cellClass: "mono" },
  { key: "successCalls", label: "Succès", align: "right", cellClass: "mono" },
  { key: "hitRate", label: "Hit rate", align: "right", cellClass: "mono", format: (r) => `${Math.round(r.hitRate * 100)}%` },
  { key: "totalPhones", label: "Tél.", align: "right", cellClass: "mono" },
  { key: "totalEmails", label: "Emails", align: "right", cellClass: "mono" },
  { key: "totalCredits", label: "Crédits", align: "right", cellClass: "mono", format: (r) => r.totalCredits?.toString() ?? "—" },
];

const recentCols: ColumnDef<ProviderCallRow>[] = [
  { key: "createdAt", label: "Date", width: "160px", cellClass: "mono mute", format: (r) => r.createdAt.slice(0, 16) },
  { key: "provider", label: "Provider", width: "110px" },
  { key: "success", label: "OK", width: "60px", format: (r) => (r.success ? "✓" : "✗") },
  { key: "phonesFound", label: "Tél.", align: "right", width: "70px", cellClass: "mono" },
  { key: "emailsFound", label: "Emails", align: "right", width: "70px", cellClass: "mono" },
  { key: "error", label: "Erreur", cellClass: "mute", format: (r) => r.error ?? "—" },
];

async function load() {
  loading.value = true;
  try {
    stats.value = (await adminApi.providerStats(30)).stats;
    recent.value = (await adminApi.providerRecent(50)).calls;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page">
    <SectionH title="Coûts providers" subtitle="Enrichissement — 30 derniers jours" />
    <DataTable :columns="statCols" :rows="stats" :row-key="(r) => r.provider" :loading="loading" empty-message="Aucun appel provider enregistré." />

    <SectionH title="Appels récents" />
    <DataTable :columns="recentCols" :rows="recent" :row-key="(r) => String(r.id)" :loading="loading" empty-message="—" />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
</style>
