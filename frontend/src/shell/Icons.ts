/**
 * Scout icon set — stroke 1.6, 16x16, currentColor.
 * Use via the `<Icon name="..." />` component or directly as Vue components.
 */
import { defineComponent, h } from "vue";

type IconPaths = { paths: string[] };

const ICONS: Record<string, IconPaths> = {
  dash:      { paths: ['<rect x="3" y="3" width="7" height="9"/>','<rect x="14" y="3" width="7" height="5"/>','<rect x="14" y="12" width="7" height="9"/>','<rect x="3" y="16" width="7" height="5"/>'] },
  table:     { paths: ['<rect x="3" y="3" width="18" height="18"/>','<path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'] },
  call:      { paths: ['<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'] },
  flame:     { paths: ['<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.59-4.31 1-6 1 2 4 4 4 7a4 4 0 1 1-8 0c0-.8.2-1.45.5-2"/>'] },
  graveyard: { paths: ['<path d="M4 21h16M6 21V11a6 6 0 0 1 12 0v10M10 17h4M12 5V3"/>'] },
  archive:   { paths: ['<rect x="2" y="3" width="20" height="5"/>','<path d="M4 8v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8M10 12h4"/>'] },
  search:    { paths: ['<circle cx="11" cy="11" r="7"/>','<path d="m21 21-4.3-4.3"/>'] },
  refresh:   { paths: ['<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>'] },
  filter:    { paths: ['<path d="M3 4h18l-7 8v7l-4-2v-5z"/>'] },
  arrow:     { paths: ['<path d="M5 12h14M13 5l7 7-7 7"/>'] },
  back:      { paths: ['<path d="M19 12H5M12 5l-7 7 7 7"/>'] },
  ext:       { paths: ['<path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7"/>'] },
  mail:      { paths: ['<rect x="3" y="5" width="18" height="14"/>','<path d="m3 7 9 7 9-7"/>'] },
  phone:     { paths: ['<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'] },
  building:  { paths: ['<rect x="4" y="3" width="16" height="18"/>','<path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-4h4v4"/>'] },
  pin:       { paths: ['<path d="M12 22s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z"/>','<circle cx="12" cy="10" r="2.5"/>'] },
  copy:      { paths: ['<rect x="9" y="9" width="13" height="13"/>','<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'] },
  more:      { paths: ['<circle cx="12" cy="12" r="1"/>','<circle cx="19" cy="12" r="1"/>','<circle cx="5" cy="12" r="1"/>'] },
  check:     { paths: ['<path d="m5 12 5 5L20 7"/>'] },
  bolt:      { paths: ['<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'] },
  doc:       { paths: ['<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>','<path d="M14 2v6h6M9 13h6M9 17h4"/>'] },
  layers:    { paths: ['<path d="m12 2 10 6-10 6L2 8z"/>','<path d="m2 16 10 6 10-6M2 12l10 6 10-6"/>'] },
  star:      { paths: ['<path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01z"/>'] },
  "user-add": { paths: ['<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>','<circle cx="9" cy="7" r="4"/>','<path d="M19 8v6M16 11h6"/>'] },
  user:      { paths: ['<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>','<circle cx="12" cy="7" r="4"/>'] },
};

/**
 * <Icon name="dash" /> — renders SVG with currentColor stroke 1.6.
 * Falls back to "layers" if name unknown.
 */
export const Icon = defineComponent({
  name: "ScoutIcon",
  props: { name: { type: String, required: true } },
  setup(props) {
    return () => {
      const def = ICONS[props.name] ?? ICONS.layers;
      return h("svg", {
        viewBox: "0 0 24 24",
        class: "ico",
        innerHTML: def.paths.join(""),
      });
    };
  },
});

export const iconExists = (name: string) => name in ICONS;
