# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Vionest Chatbot
**Updated:** 2026-11-02
**Category:** AI/Chatbot Platform (Internal Enterprise)

---

## Global Rules

### Color Palette (Brand Identity)

| Role | Hex | CSS Variable / Tailwind | Usage |
|------|-----|-------------------------|-------|
| Primary | `#2bace2` | `--color-primary` / `brand-500` | Accents, active elements, CTAs |
| Secondary | `#3fb8e8` | `--color-secondary` / `brand-400` | Links, focus rings, highlights |
| Background Dark | `#1b275d` | `--color-bg-dark` / `surface-dark` | App background, deep containers |
| Surface / Card | `#283160` | `--color-card-dark` / `surface-card` | Message cards, modals, sidebars |
| Surface Hover | `#324078` | `surface-hover` | Interactive hover states |
| Border | `#3d4e8a` | `surface-border` | Subtle dividing lines & borders |
| Text Primary | `#ffffff` | `text-white` | Headings, key text |
| Text Muted | `#94a3b8` | `text-slate-400` | Subtitles, timestamps, placeholders |
| Destructive | `#dc2626` | `text-red-500` / `bg-red-600` | Delete actions, errors |
| Success | `#10b981` | `text-emerald-400` | Connected state, confirmations |

**Color Notes:** Paleta oficial de marca Vionest basada en Azul Profundo (`#1b275d`), Azul Marino Medio (`#283160`), Cyan Primario (`#2bace2`) y Blanco (`#ffffff`).

### Typography

- **Heading Font:** Inter
- **Body Font:** Inter
- **Mood:** clean, technical, high-contrast, modern dark UI, enterprise-ready
- **Google Fonts:** [Inter](https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap)

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #2bace2;
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 150ms ease;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(43, 172, 226, 0.25);
}

.btn-primary:hover {
  background: #3fb8e8;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: #283160;
  color: #ffffff;
  border: 1px solid #3d4e8a;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 150ms ease;
  cursor: pointer;
}
```

### Cards & Bubbles

```css
.card {
  background: #283160;
  border: 1px solid #3d4e8a;
  border-radius: 16px;
  padding: 20px;
}

.chat-bubble-assistant {
  background: #283160;
  border: 1px solid #3d4e8a;
  color: #f1f5f9;
  border-radius: 16px;
}

.chat-bubble-user {
  background: #2bace2;
  color: #ffffff;
  border-radius: 16px;
}
```

---

## Style Guidelines

**Style:** Modern Dark UI / AI Copilot
**Assets:**
- Logo: `/logo.webp` (ubicado en `client/public/logo.webp`)
- Favicon: `/favicon.ico` (ubicado en `client/public/favicon.ico`)
