<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { SearchProvider, SearchResult } from "../core/types";
import { Icon } from "./Icons";

const props = defineProps<{
  open: boolean;
  provider: SearchProvider;
  placeholder?: string;
}>();
const emit = defineEmits<{ (e: "close"): void }>();

const router = useRouter();
const inputEl = ref<HTMLInputElement | null>(null);
const query = ref("");
const results = ref<SearchResult[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const active = ref(0);

/** Monotonic token so late-arriving responses from stale queries are dropped. */
let seq = 0;
let debounce: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      query.value = "";
      results.value = [];
      error.value = null;
      active.value = 0;
      nextTick(() => inputEl.value?.focus());
    } else if (debounce) {
      clearTimeout(debounce);
    }
  },
);

watch(query, (q) => {
  if (debounce) clearTimeout(debounce);
  const trimmed = q.trim();
  if (trimmed.length < 2) {
    results.value = [];
    loading.value = false;
    error.value = null;
    return;
  }
  loading.value = true;
  debounce = setTimeout(() => void run(trimmed), 180);
});

async function run(q: string) {
  const token = ++seq;
  try {
    const hits = await props.provider(q);
    if (token !== seq) return; // a newer query superseded this one
    results.value = hits;
    error.value = null;
    active.value = 0;
  } catch (e) {
    if (token !== seq) return;
    results.value = [];
    error.value = e instanceof Error ? e.message : "Recherche indisponible";
  } finally {
    if (token === seq) loading.value = false;
  }
}

/** Results in display order, paired with their flat index for keyboard nav. */
const groups = computed(() => {
  const out: { label: string; items: { result: SearchResult; index: number }[] }[] = [];
  results.value.forEach((result, index) => {
    let g = out.find((x) => x.label === result.group);
    if (!g) {
      g = { label: result.group, items: [] };
      out.push(g);
    }
    g.items.push({ result, index });
  });
  return out;
});

function select(result: SearchResult) {
  emit("close");
  void router.push(result.to);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (results.value.length) active.value = (active.value + 1) % results.value.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (results.value.length)
      active.value = (active.value - 1 + results.value.length) % results.value.length;
  } else if (e.key === "Enter") {
    e.preventDefault();
    const hit = results.value[active.value];
    if (hit) select(hit);
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="cmdk">
      <div v-if="open" class="cmdk-backdrop" @click.self="emit('close')">
        <div class="cmdk" role="dialog" aria-modal="true">
          <div class="cmdk-input">
            <Icon name="search" />
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              :placeholder="placeholder ?? 'Rechercher…'"
              spellcheck="false"
              autocomplete="off"
              @keydown="onKeydown"
            />
            <span class="cmdk-esc">esc</span>
          </div>

          <div class="cmdk-body">
            <p v-if="error" class="cmdk-msg cmdk-err">{{ error }}</p>
            <p v-else-if="query.trim().length < 2" class="cmdk-msg">
              Tape au moins 2 caractères.
            </p>
            <p v-else-if="loading && !results.length" class="cmdk-msg">Recherche…</p>
            <p v-else-if="!results.length" class="cmdk-msg">Aucun résultat.</p>

            <template v-else>
              <div v-for="g in groups" :key="g.label" class="cmdk-group">
                <div class="cmdk-group-label">{{ g.label }}</div>
                <button
                  v-for="{ result, index } in g.items"
                  :key="result.id"
                  type="button"
                  class="cmdk-row"
                  :class="{ active: index === active }"
                  @mouseenter="active = index"
                  @click="select(result)"
                >
                  <Icon :name="result.icon ?? 'arrow'" />
                  <span class="cmdk-row-title">{{ result.title }}</span>
                  <span v-if="result.subtitle" class="cmdk-row-sub">{{ result.subtitle }}</span>
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cmdk-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 14vh;
  background: color-mix(in srgb, var(--scout-bg) 55%, transparent);
  backdrop-filter: blur(2px);
}
.cmdk {
  width: min(560px, calc(100vw - 32px));
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  background: var(--scout-elev);
  border: 1px solid var(--scout-hair);
  border-radius: var(--scout-radius-lg);
  box-shadow: 0 20px 60px -20px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}
.cmdk-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--scout-hair);
}
.cmdk-input :deep(.ico) {
  width: 18px;
  height: 18px;
  color: var(--scout-mute);
  flex-shrink: 0;
}
.cmdk-input input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--scout-ink);
  font-size: 15px;
  font-family: var(--scout-font-text);
}
.cmdk-input input::placeholder {
  color: var(--scout-mute);
}
.cmdk-esc {
  font-family: var(--scout-font-mono);
  font-size: 10.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--scout-surface);
  border: 1px solid var(--scout-hair);
  color: var(--scout-mute);
}
.cmdk-body {
  overflow-y: auto;
  padding: 6px;
}
.cmdk-msg {
  padding: 18px 14px;
  text-align: center;
  color: var(--scout-mute);
  font-size: 13px;
}
.cmdk-err {
  color: var(--scout-danger);
}
.cmdk-group + .cmdk-group {
  margin-top: 4px;
}
.cmdk-group-label {
  padding: 8px 12px 4px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--scout-mute);
  font-weight: 600;
}
.cmdk-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: var(--scout-radius-sm);
  cursor: pointer;
  text-align: left;
  color: var(--scout-ink);
  font-size: 14px;
}
.cmdk-row :deep(.ico) {
  width: 15px;
  height: 15px;
  color: var(--scout-mute);
  flex-shrink: 0;
}
.cmdk-row.active {
  background: var(--scout-accent-soft);
}
.cmdk-row.active :deep(.ico) {
  color: var(--scout-accent);
}
.cmdk-row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cmdk-row-sub {
  margin-left: auto;
  padding-left: 12px;
  color: var(--scout-mute);
  font-size: 12px;
  font-family: var(--scout-font-mono);
  white-space: nowrap;
  flex-shrink: 0;
}
.cmdk-enter-active,
.cmdk-leave-active {
  transition: opacity var(--scout-t-fast) var(--scout-ease);
}
.cmdk-enter-from,
.cmdk-leave-to {
  opacity: 0;
}
</style>
