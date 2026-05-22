<script setup lang="ts">
import Chip from "./Chip.vue";

export interface TodayCallItem {
  id: string;
  name: string;
  sub: string;
  heat?: "hot" | "warm" | "cold";
  fit?: number;
}

defineProps<{
  /** Pre-headline label (left of the "·"). E.g. "Blitz day · jeudi 28/05". */
  campaignLabel: string;
  /** Right-side hint (e.g. "J–6"). */
  campaignHint?: string;
  /** Big sentence with optional <em>highlight</em> via slot. */
  headlineHtml?: string;
  /** 0..1 progress to fill bar. */
  progress?: number;
  /** 0..1 target marker position. */
  targetMark?: number;
  /** 4 small stats under the bar. */
  stats?: Array<{ value: string; label: string; tone?: "primary" }>;
  /** Right column: queued calls. */
  nextCalls?: TodayCallItem[];
  /** Background big italic numeral (e.g. "28"). */
  bigNumeral?: string;
  /** Flag content as mock (badge). */
  mock?: boolean;
}>();

defineEmits<{ "call-click": [item: TodayCallItem] }>();
</script>

<template>
  <div class="today">
    <div class="leftCol">
      <div class="progressLabel">
        <span>{{ campaignLabel }}</span>
        <span v-if="campaignHint">·</span>
        <span v-if="campaignHint" style="color: var(--scout-ink);">{{ campaignHint }}</span>
        <Chip v-if="mock" kind="mock" no-dot>mock</Chip>
      </div>

      <div class="h" v-if="headlineHtml" v-html="headlineHtml" />
      <div class="h" v-else><slot name="headline" /></div>

      <div v-if="progress != null" class="progressBar">
        <div class="done" :style="{ width: `${Math.round(progress * 100)}%` }" />
        <div
          v-if="targetMark != null"
          class="target"
          :style="{ left: `${Math.round(targetMark * 100)}%` }"
        />
      </div>

      <div v-if="stats && stats.length" class="targets">
        <div v-for="(s, i) in stats" :key="i" class="target-stat">
          <div class="v tnum" :style="s.tone === 'primary' ? { color: 'var(--scout-primary)' } : {}">{{ s.value }}</div>
          <div class="l">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div v-if="nextCalls && nextCalls.length" class="nextList">
      <div class="nl-h">
        <span>Prochains appels</span>
        <span style="color: var(--scout-mute);">fit · heat</span>
      </div>
      <div
        v-for="(c, i) in nextCalls"
        :key="c.id"
        class="item"
        @click="$emit('call-click', c)"
      >
        <div class="ix">{{ String(i + 1).padStart(2, "0") }}</div>
        <div class="name">{{ c.name }}<span class="sub">{{ c.sub }}</span></div>
        <div v-if="c.fit != null" class="mono tnum" style="font-size: 12px; color: var(--scout-mute);">{{ c.fit }}</div>
        <Chip v-if="c.heat" :kind="c.heat">{{ c.heat }}</Chip>
      </div>
    </div>

    <div v-if="bigNumeral" class="bignum">{{ bigNumeral }}</div>
  </div>
</template>
