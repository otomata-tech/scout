<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import DataTable, { type ColumnDef } from "@/shell/DataTable.vue";
import SectionH from "@/shell/SectionH.vue";
import { leadsApi, LEAD_STATUSES, type Lead } from "../api";

const router = useRouter();
const leads = ref<Lead[]>([]);
const loading = ref(false);
const q = ref("");
const status = ref("");
const newName = ref("");

const columns: ColumnDef<Lead>[] = [
  { key: "id", label: "#", align: "right", width: "56px", cellClass: "mono mute" },
  { key: "name", label: "Nom" },
  { key: "status", label: "Statut", width: "120px" },
  { key: "source", label: "Source", width: "120px", cellClass: "mute", format: (r) => r.source ?? "—" },
  { key: "claimedByName", label: "Réclamé par", width: "140px", cellClass: "mute", format: (r) => r.claimedByName ?? r.claimedBy ?? "—" },
  { key: "updatedAt", label: "MAJ", width: "180px", cellClass: "mono mute", format: (r) => r.updatedAt.slice(0, 16) },
];

async function load() {
  loading.value = true;
  try {
    const res = await leadsApi.list({ q: q.value, status: status.value });
    leads.value = res.leads;
  } finally {
    loading.value = false;
  }
}

async function create() {
  if (!newName.value.trim()) return;
  await leadsApi.create({ name: newName.value.trim() });
  newName.value = "";
  await load();
}

onMounted(load);
</script>

<template>
  <div class="leads-page">
    <SectionH title="Leads" :subtitle="`${leads.length} entrées`" />

    <div class="toolbar">
      <input v-model="q" placeholder="Rechercher…" @keyup.enter="load" />
      <select v-model="status" @change="load">
        <option value="">Tous statuts</option>
        <option v-for="s in LEAD_STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <span class="spacer" />
      <input v-model="newName" placeholder="Nouveau lead…" @keyup.enter="create" />
      <button @click="create">+ Créer</button>
    </div>

    <DataTable
      :columns="columns"
      :rows="leads"
      :row-key="(r) => String(r.id)"
      :loading="loading"
      :row-href="(r) => `/leads/${r.id}`"
      empty-message="Aucun lead — créez-en un ci-dessus."
      @row-click="(r) => router.push(`/leads/${r.id}`)"
    />
  </div>
</template>

<style scoped>
.leads-page { display: flex; flex-direction: column; gap: 1rem; }
.toolbar { display: flex; gap: 0.5rem; align-items: center; }
.toolbar .spacer { flex: 1; }
.toolbar input, .toolbar select {
  padding: 0.4rem 0.6rem; border: 1px solid var(--scout-hair); border-radius: 8px;
  background: var(--scout-surface); color: var(--scout-ink);
}
.toolbar button {
  padding: 0.4rem 0.8rem; border: none; border-radius: 8px; cursor: pointer;
  background: var(--scout-primary); color: var(--scout-primary-foreground, white);
}
</style>
