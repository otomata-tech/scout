<script setup lang="ts" generic="T extends Record<string, unknown>">
export interface ColumnDef<T> {
  key: string;
  label: string;
  /** "r" for numeric/right-aligned, else left. */
  align?: "left" | "right";
  /** "mute" applies muted-foreground color; "mono" applies monospace; combine via space. */
  cellClass?: string;
  /** Inline width style (e.g. "26%" or "90px"). */
  width?: string;
  /** Tailwind width class (e.g. "w-32") — legacy, alias for width. */
  widthClass?: string;
  /** Custom renderer; returns a string. Falls back to row[key] → "—". */
  format?: (row: T) => string;
}

const props = defineProps<{
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Currently active row (highlighted). */
  activeKey?: string;
  emptyMessage?: string;
  loading?: boolean;
  /** Show numbered index column on the left. */
  indexed?: boolean;
  /** Generate an href per row — enables Ctrl+click / middle-click / "open in new tab". */
  rowHref?: (row: T) => string | undefined;
}>();

const emit = defineEmits<{ "row-click": [row: T]; "row-hover": [row: T] }>();

function onRowClick(e: MouseEvent, row: T) {
  const href = props.rowHref?.(row);
  if (href && (e.ctrlKey || e.metaKey)) {
    window.open(href, "_blank");
    return;
  }
  emit("row-click", row);
}

function onMiddleClick(row: T) {
  const href = props.rowHref?.(row);
  if (href) window.open(href, "_blank");
}

function cellValue(row: T, col: ColumnDef<T>): string {
  if (col.format) return col.format(row);
  const v = (row as Record<string, unknown>)[col.key];
  return v == null || v === "" ? "—" : String(v);
}
</script>

<template>
  <div class="tblcard">
    <table class="tbl">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[col.align === 'right' ? 'r' : '', col.cellClass ?? '']"
            :style="col.width ? { width: col.width } : undefined"
          >{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="rowKey(row)"
          :class="activeKey === rowKey(row) ? 'active' : ''"
          @mouseenter="$emit('row-hover', row)"
          @click="onRowClick($event, row)"
          @mousedown.middle.prevent="onMiddleClick(row)"
        >
          <td
            v-for="(col, ci) in columns"
            :key="col.key"
            :class="[col.align === 'right' ? 'r' : '', col.cellClass ?? '']"
          >
            <template v-if="indexed && ci === 0">
              <span class="lead">
                <span class="ix">{{ String(i + 1).padStart(2, "0") }}</span>
                {{ cellValue(row, col) }}
              </span>
            </template>
            <template v-else>{{ cellValue(row, col) }}</template>
          </td>
        </tr>
        <tr v-if="!loading && !rows.length">
          <td
            :colspan="columns.length"
            style="text-align: center; color: var(--scout-mute); padding: 40px 12px;"
          >{{ emptyMessage ?? "Aucun résultat" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
