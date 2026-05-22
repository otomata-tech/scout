<script setup lang="ts" generic="T extends Record<string, unknown>">
import { cn } from "../lib/utils";

export interface ColumnDef<T> {
  key: string;
  label: string;
  /** "right" pour numeric / "left" par défaut */
  align?: "left" | "right";
  /** "font-mono" / "text-muted-foreground" — classes appliquées sur td */
  cellClass?: string;
  /** Width hint, e.g. "w-32" */
  widthClass?: string;
  /** Custom renderer; returns string ("—" si null) */
  format?: (row: T) => string;
}

const props = defineProps<{
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
}>();

defineEmits<{ "row-click": [row: T] }>();

function cellValue(row: T, col: ColumnDef<T>): string {
  if (col.format) return col.format(row);
  const v = (row as Record<string, unknown>)[col.key];
  return v == null ? "—" : String(v);
}
</script>

<template>
  <div class="overflow-x-auto border border-border rounded-lg bg-card">
    <table class="w-full text-sm">
      <thead class="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="cn(
              'px-3 py-2',
              col.align === 'right' ? 'text-right' : 'text-left',
              col.widthClass
            )"
          >{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="rowKey(row)"
          class="border-t border-border hover:bg-muted/30 cursor-default"
          @click="$emit('row-click', row)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :class="cn(
              'px-3 py-2',
              col.align === 'right' ? 'text-right' : 'text-left',
              col.cellClass ?? 'text-foreground'
            )"
          >{{ cellValue(row, col) }}</td>
        </tr>
        <tr v-if="!loading && !rows.length">
          <td :colspan="columns.length" class="px-3 py-10 text-center text-muted-foreground">
            {{ emptyMessage ?? "Aucun résultat" }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
