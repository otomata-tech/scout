<script setup lang="ts">
import Chip from "./Chip.vue";
import { Icon } from "./Icons";

defineProps<{
  /** Display name (full name preferred). */
  name?: string | null;
  /** Subtitle / title under the name (e.g. job role). */
  subtitle?: string | null;
  /** Phone in international format (e.g. +33 6 12 34 56 78). Null = no phone. */
  phone?: string | null;
  /** Email (for the mail button). */
  email?: string | null;
  /** Pitch script — italic, with quote-style left border. */
  script?: string | null;
  /** "MOCK" badge to flag synthetic content (when the API doesn't have it yet). */
  mock?: boolean;
}>();

defineEmits<{ "call": []; "mail": []; "copy": [] }>();

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function telHref(p?: string | null): string {
  if (!p) return "#";
  return `tel:${p.replace(/\s/g, "")}`;
}

function mailtoHref(e?: string | null): string {
  if (!e) return "#";
  return `mailto:${e}`;
}
</script>

<template>
  <div class="call-panel">
    <div>
      <div class="kicker" style="margin-bottom: 6px; display:flex; align-items:center; gap:8px;">
        <span>one-liner blitz day</span>
        <Chip v-if="mock" kind="mock" no-dot>script mock</Chip>
      </div>
      <div class="person">
        <div class="avatar">{{ initials(name) }}</div>
        <div>
          <div style="font-weight: 500;">{{ name ?? "Contact inconnu" }}</div>
          <div v-if="subtitle" style="color: var(--scout-mute); font-size: 12px;">{{ subtitle }}</div>
        </div>
      </div>
    </div>

    <a v-if="phone" class="phone" :href="telHref(phone)">{{ phone }}</a>
    <div v-else class="phone" style="color: var(--scout-mute); font-size: 16px; font-weight: 500;">
      Pas de numéro · enrichissement Kaspr requis
    </div>

    <div style="display: flex; gap: 6px;">
      <button
        class="btn btn-primary"
        style="flex: 1; justify-content: center;"
        :disabled="!phone"
        @click="$emit('call')"
      >
        <Icon name="phone" />
        <span>{{ phone ? "Lancer l'appel" : "Numéro manquant" }}</span>
      </button>
      <a v-if="email" class="btn" :href="mailtoHref(email)" @click="$emit('mail')"><Icon name="mail" /></a>
      <button v-else class="btn" disabled><Icon name="mail" /></button>
      <button class="btn" @click="$emit('copy')"><Icon name="copy" /></button>
    </div>

    <div v-if="script" class="script">{{ script }}</div>

    <div v-if="$slots.signals">
      <div class="kicker" style="margin-bottom: 8px; display:flex; align-items:center; gap:8px;">
        <span>signaux récents</span>
        <Chip v-if="mock" kind="mock" no-dot>mock</Chip>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <slot name="signals" />
      </div>
    </div>

    <div
      v-if="$slots.footer"
      style="border-top: 1px solid var(--scout-hair); padding-top: 12px; font-size: 12px; color: var(--scout-mute); display: flex; justify-content: space-between;"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
