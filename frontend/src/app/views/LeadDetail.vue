<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import SectionH from "@/shell/SectionH.vue";
import { leadsApi, LEAD_STATUSES, type Lead, type LeadLog } from "../api";

const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params.id));
const lead = ref<Lead | null>(null);
const logs = ref<LeadLog[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    lead.value = await leadsApi.get(id.value);
    logs.value = (await leadsApi.logs(id.value)).logs;
  } finally {
    loading.value = false;
  }
}

async function setStatus(e: Event) {
  const status = (e.target as HTMLSelectElement).value;
  lead.value = await leadsApi.update(id.value, { status });
}

async function toggleClaim() {
  if (!lead.value) return;
  const res = lead.value.claimedBy ? await leadsApi.release(id.value) : await leadsApi.claim(id.value);
  lead.value = res.lead;
  logs.value = (await leadsApi.logs(id.value)).logs;
}

async function remove() {
  if (!confirm("Supprimer ce lead ?")) return;
  await leadsApi.remove(id.value);
  router.push("/leads");
}

onMounted(load);
</script>

<template>
  <div v-if="lead" class="detail">
    <SectionH :title="lead.name" :subtitle="`Lead #${lead.id}`" />

    <div class="actions">
      <select :value="lead.status" @change="setStatus">
        <option v-for="s in LEAD_STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <button @click="toggleClaim">{{ lead.claimedBy ? "Libérer" : "Réclamer" }}</button>
      <span class="spacer" />
      <button class="danger" @click="remove">Supprimer</button>
    </div>

    <dl class="fields">
      <div><dt>Source</dt><dd>{{ lead.source ?? "—" }}</dd></div>
      <div><dt>Réclamé par</dt><dd>{{ lead.claimedByName ?? lead.claimedBy ?? "—" }}</dd></div>
      <div><dt>Créé</dt><dd>{{ lead.createdAt.slice(0, 16) }} · {{ lead.createdBy ?? "—" }}</dd></div>
      <div><dt>MAJ</dt><dd>{{ lead.updatedAt.slice(0, 16) }} · {{ lead.updatedBy ?? "—" }}</dd></div>
    </dl>

    <SectionH title="Données" />
    <pre class="data">{{ JSON.stringify(lead.data, null, 2) }}</pre>

    <SectionH title="Journal" :subtitle="`${logs.length} entrées`" />
    <ul class="logs">
      <li v-for="l in logs" :key="l.id">
        <span class="kind">{{ l.kind }}</span>
        <span class="content">{{ l.content }}</span>
        <span class="at">{{ l.createdAt.slice(0, 16) }}</span>
      </li>
      <li v-if="!logs.length" class="empty">Aucune entrée.</li>
    </ul>
  </div>
  <div v-else-if="!loading">Lead introuvable. <RouterLink to="/leads">← Retour</RouterLink></div>
</template>

<style scoped>
.detail { display: flex; flex-direction: column; gap: 1rem; }
.actions { display: flex; gap: 0.5rem; align-items: center; }
.actions .spacer { flex: 1; }
.actions select, .actions button {
  padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid var(--scout-hair);
  background: var(--scout-surface); color: var(--scout-ink); cursor: pointer;
}
.actions button.danger { color: #c0392b; border-color: #e6b0aa; }
.fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem 2rem; }
.fields div { display: flex; gap: 0.5rem; }
.fields dt { color: var(--scout-mute); min-width: 110px; }
.data {
  background: var(--scout-surface-2); border: 1px solid var(--scout-hair-soft);
  border-radius: 8px; padding: 0.75rem; font-family: var(--scout-font-mono, monospace);
  font-size: 0.85rem; overflow: auto;
}
.logs { display: flex; flex-direction: column; gap: 0.25rem; list-style: none; padding: 0; }
.logs li { display: flex; gap: 0.75rem; align-items: baseline; }
.logs .kind { font-weight: 600; min-width: 80px; }
.logs .content { flex: 1; }
.logs .at { color: var(--scout-mute); font-family: var(--scout-font-mono, monospace); font-size: 0.8rem; }
.logs .empty { color: var(--scout-mute); }
</style>
