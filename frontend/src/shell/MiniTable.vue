<script setup lang="ts" generic="T extends Record<string, unknown>">
export interface MiniColumnDef<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  /** "mute" applies mute color via inline style. */
  tone?: "default" | "mute";
  /** Format value to string (else String(row[key])). */
  format?: (row: T) => string;
  /** Conditional emphasis (e.g. % cell turns green if >= 0.15). */
  emphasize?: (row: T) => "success" | "muted" | null;
}

const props = defineProps<{
  columns: MiniColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}>();

function cell(row: T, col: MiniColumnDef<T>): string {
  if (col.format) return col.format(row);
  const v = (row as Record<string, unknown>)[col.key];
  return v == null ? "—" : String(v);
}

function cellStyle(row: T, col: MiniColumnDef<T>): Record<string, string> {
  if (col.tone === "mute") return { color: "var(--scout-mute)" };
  const emph = col.emphasize?.(row);
  if (emph === "success") return { color: "var(--scout-success)", fontWeight: "600" };
  if (emph === "muted") return { color: "var(--scout-mute)" };
  return {};
}
</script>

<template>
  <table class="miniTbl">
    <thead>
      <tr>
        <th
          v-for="col in columns"
          :key="col.key"
          :class="col.align === 'right' ? 'r' : ''"
        >{{ col.label }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="rowKey(row)">
        <td
          v-for="col in columns"
          :key="col.key"
          :class="col.align === 'right' ? 'r' : ''"
          :style="cellStyle(row, col)"
        >{{ cell(row, col) }}</td>
      </tr>
    </tbody>
  </table>
</template>
