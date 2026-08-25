# Styling Guide: Design System Documentation

This document provides a comprehensive guide to the styling patterns, color schemes, gradients, shadows, and design system used throughout the application. Use this guide to maintain consistency when adding new components or modifying existing ones.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette & Variants](#color-palette--variants)
3. [Background Patterns](#background-patterns)
4. [Card Styling](#card-styling)
5. [Button Styling](#button-styling)
6. [Badge Styling](#badge-styling)
7. [Input & Form Elements](#input--form-elements)
8. [Table Styling](#table-styling)
9. [Dropdown & Menu Styling](#dropdown--menu-styling)
10. [Filter & Search Components](#filter--search-components)
11. [Shadows & Effects](#shadows--effects)
12. [Transparency & Blur](#transparency--blur)
13. [Border Patterns](#border-patterns)
14. [Responsive Design](#responsive-design)

---

## Design Philosophy

The design system is built on the following principles:

- **Glassmorphism**: Transparent backgrounds with backdrop blur effects
- **Gradient Overlays**: Multi-stop gradients for depth and visual interest
- **Consistent Opacity**: Using opacity modifiers (`/10`, `/20`, `/30`, etc.) for layered transparency
- **Color-coded Variants**: Different color themes (sky, emerald, amber, rose, violet, blue) for semantic meaning
- **Subtle Shadows**: Colored shadows that match the component's color theme
- **Smooth Transitions**: All interactive elements have transition effects

---

## Color Palette & Variants

### Primary Color Variants

The system uses 6 main color variants for semantic differentiation:

| Variant | Use Case | RGB Values |
|---------|----------|------------|
| **Sky** | Primary actions, info, default cards | `rgb(2,132,199)` |
| **Emerald** | Success, active states, positive metrics | `rgb(16,185,129)` |
| **Amber** | Warnings, active projects, highlights | `rgb(245,158,11)` |
| **Rose** | Destructive actions, errors, delete buttons | `rgb(225,29,72)` |
| **Violet** | Filters, search, secondary actions | `rgb(139,92,246)` |
| **Blue** | Alternative primary, navigation | `rgb(59,130,246)` |

### Opacity Scale

Consistent opacity values used throughout:

- `/5` - Very subtle backgrounds
- `/10` - Light backgrounds, borders
- `/15` - Medium backgrounds
- `/20` - Hover states, borders
- `/25` - Gradient starts
- `/30` - Borders, gradient middle
- `/40` - Button borders, hover states
- `/50` - Medium backgrounds, overlays
- `/60` - Text, icons
| `/70` - Text, icons
- `/80` - Hover states
- `/85` - Headers, sticky elements

---

## Background Patterns

### Page Background (Full Screen)

**Pattern**: Radial gradients with multiple layers for depth

```html
<div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)]">
  <!-- Background overlay layer -->
  <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),transparent_60%)]"></div>
  
  <!-- Content -->
  <div class="relative z-10">
    <!-- Your content here -->
  </div>
</div>
```

**Breakdown**:
- **Top gradient**: `rgba(59,130,246,0.15)` (blue) fading to transparent at 55%
- **Bottom gradient**: `rgba(236,72,153,0.12)` (pink) fading to transparent at 65%
- **Overlay layer**: Subtle white radial gradient at center with 5% opacity
- **Z-index**: Overlay at `z-0`, content at `z-10`

### Dashboard/App Background

```html
<div class="app-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)]">
  <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),transparent_60%)]"></div>
  <div class="relative z-10 flex min-h-screen flex-col">
    <!-- Header, Main, Footer -->
  </div>
</div>
```

---

## Card Styling

### Stat Card (Default Pattern)

Cards use 3-stop gradients with colored borders and shadows.

#### Sky Variant (Default/Info)

```html
<article class="group rounded-[28px] border border-sky-400/30 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 p-6 shadow-[0_30px_80px_rgba(2,132,199,0.35)] backdrop-blur-sm transition hover:border-sky-300/50">
  <div class="flex items-start justify-between gap-4">
    <div>
      <p class="text-xs uppercase tracking-[0.45em] text-white/60">Title</p>
      <p class="mt-3 text-3xl font-semibold text-white">Value</p>
    </div>
  </div>
  <p class="mt-4 text-sm text-white/70">Description text</p>
</article>
```

**Key Classes**:
- `rounded-[28px]` - Large border radius for modern look
- `border border-sky-400/30` - Colored border with 30% opacity
- `bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5` - 3-stop gradient (top-left to bottom-right)
- `shadow-[0_30px_80px_rgba(2,132,199,0.35)]` - Colored shadow matching the theme
- `backdrop-blur-sm` - Glassmorphism effect
- `hover:border-sky-300/50` - Lighter border on hover

#### Emerald Variant (Success/Active)

```html
<article class="group rounded-[28px] border border-emerald-400/30 bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-emerald-500/5 p-6 shadow-[0_30px_80px_rgba(16,185,129,0.3)] backdrop-blur-sm transition hover:border-emerald-300/50">
  <!-- Content -->
</article>
```

#### Amber Variant (Warning/Highlight)

```html
<article class="group rounded-[28px] border border-amber-400/30 bg-gradient-to-br from-amber-500/30 via-amber-500/15 to-amber-500/5 p-6 shadow-[0_30px_80px_rgba(245,158,11,0.25)] backdrop-blur-sm transition hover:border-amber-300/60">
  <!-- Content -->
</article>
```

**Note**: Amber uses slightly higher opacity (`/30` and `/15`) for more visibility.

#### Rose Variant (Destructive/Error)

```html
<article class="group rounded-[28px] border border-rose-400/30 bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-rose-500/5 p-6 shadow-[0_30px_80px_rgba(225,29,72,0.35)] backdrop-blur-sm transition hover:border-rose-300/50">
  <!-- Content -->
</article>
```

#### Violet Variant (Secondary/Filter)

```html
<article class="group rounded-[28px] border border-violet-400/30 bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-violet-500/5 p-6 shadow-[0_30px_80px_rgba(139,92,246,0.35)] backdrop-blur-sm transition hover:border-violet-300/50">
  <!-- Content -->
</article>
```

#### Blue Variant (Alternative Primary)

```html
<article class="group rounded-[28px] border border-blue-400/30 bg-gradient-to-br from-blue-500/25 via-blue-500/10 to-blue-500/5 p-6 shadow-[0_30px_80px_rgba(59,130,246,0.35)] backdrop-blur-sm transition hover:border-blue-300/50">
  <!-- Content -->
</article>
```

### Standard Card (Neutral)

For cards without specific color variants:

```html
<div class="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-sm shadow-lg p-6">
  <!-- Content -->
</div>
```

**Key Classes**:
- `border border-white/10` - Subtle white border
- `bg-gradient-to-br from-white/5 via-white/5 to-white/5` - Neutral gradient
- `shadow-lg` - Standard shadow (no color)

### Project Card (List Item)

```html
<div class="relative flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-white/10 rounded-[20px] bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-sm hover:border-white/20 hover:from-white/10 hover:via-white/10 hover:to-white/10 transition-all">
  <!-- Content -->
</div>
```

**Key Differences**:
- `rounded-[20px]` - Slightly smaller radius
- Interactive hover states that lighten the gradient
- Responsive flex layout

---

## Button Styling

### Primary Button (Default)

```html
<button type="button" class="inline-flex items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-r from-primary/70 via-primary/50 to-primary/30 px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(59,130,246,0.45)] backdrop-blur-sm transition duration-200 hover:border-primary/40 hover:from-primary/80 hover:via-primary/60 hover:to-primary/40">
  Button Text
</button>
```

**Key Classes**:
- `bg-gradient-to-r` - Horizontal gradient (left to right)
- `from-primary/70 via-primary/50 to-primary/30` - 3-stop gradient
- `shadow-[0_15px_35px_rgba(59,130,246,0.45)]` - Colored shadow
- Hover states increase opacity (`/80`, `/60`, `/40`)

### Destructive Button (Delete/Logout)

```html
<button type="button" class="inline-flex items-center justify-center rounded-xl border border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(225,29,72,0.45)] backdrop-blur-sm transition duration-200 hover:border-rose-300/40 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40">
  Delete / Log out
</button>
```

### Outline Button

```html
<button type="button" class="border border-white/10 bg-background/50 backdrop-blur-sm shadow-xs hover:bg-accent/50 hover:border-white/20 hover:text-accent-foreground px-4 py-2 rounded-md transition">
  Outline Button
</button>
```

**Key Classes**:
- `border border-white/10` - Subtle border
- `bg-background/50` - Semi-transparent background
- `hover:border-white/20` - Brighter border on hover

### Ghost Button

```html
<button type="button" class="hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm px-4 py-2 rounded-md transition">
  Ghost Button
</button>
```

### Secondary Button

```html
<button type="button" class="bg-gradient-to-r from-secondary/70 via-secondary/50 to-secondary/30 text-secondary-foreground border border-secondary/30 shadow-xs hover:bg-secondary/80 backdrop-blur-sm px-4 py-2 rounded-md transition">
  Secondary
</button>
```

### Button Size Variants

- **Default**: `h-9 px-4 py-2`
- **Small**: `h-8 px-3 rounded-md`
- **Large**: `h-10 px-6 rounded-md`
- **Icon**: `size-9` (square)

---

## Badge Styling

### Active Badge (Emerald)

```html
<span class="text-xs border border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/10 to-emerald-500/5 text-white px-2 py-0.5 rounded-md backdrop-blur-sm shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
  Active
</span>
```

### Inactive Badge (Gray)

```html
<span class="text-xs border border-gray-400/30 bg-gradient-to-r from-gray-500/25 via-gray-500/10 to-gray-500/5 text-white/70 px-2 py-0.5 rounded-md backdrop-blur-sm shadow-[0_10px_30px_rgba(107,114,128,0.2)]">
  Inactive
</span>
```

### Filter Badge (Sky)

```html
<div class="inline-flex items-center gap-1 px-2 py-1 text-xs border border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/10 to-sky-500/5 text-white rounded-md backdrop-blur-sm shadow-[0_10px_30px_rgba(2,132,199,0.2)]">
  Filter: Value
  <button class="ml-1 hover:text-destructive transition-colors">
    <X class="h-3 w-3" />
  </button>
</div>
```

### Filter Badge (Amber)

```html
<div class="inline-flex items-center gap-1 px-2 py-1 text-xs border border-amber-400/30 bg-gradient-to-r from-amber-500/25 via-amber-500/10 to-amber-500/5 text-white rounded-md backdrop-blur-sm shadow-[0_10px_30px_rgba(245,158,11,0.2)]">
  Rating: 5 ⭐
  <button class="ml-1 hover:text-destructive transition-colors">
    <X class="h-3 w-3" />
  </button>
</div>
```

### Filter Badge (Violet)

```html
<div class="inline-flex items-center gap-1 px-2 py-1 text-xs border border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-violet-500/10 to-violet-500/5 text-white rounded-md backdrop-blur-sm shadow-[0_10px_30px_rgba(139,92,246,0.2)]">
  Search: "query"
  <button class="ml-1 hover:text-destructive transition-colors">
    <X class="h-3 w-3" />
  </button>
</div>
```

**Badge Pattern**:
- Small padding: `px-2 py-0.5` or `px-2 py-1`
- Horizontal gradient: `bg-gradient-to-r`
- Smaller shadows: `shadow-[0_10px_30px_rgba(...)]`
- `backdrop-blur-sm` for glassmorphism

---

## Input & Form Elements

### Search Input

```html
<div class="relative flex-1 sm:max-w-sm">
  <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <input
    type="text"
    placeholder="Search projects..."
    class="pl-9 pr-9 w-full bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)] rounded-md px-3 py-2"
  />
  <!-- Clear button (X) when value exists -->
  <button class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
    <X class="h-4 w-4" />
  </button>
</div>
```

**Key Classes**:
- `bg-white/5` - Very subtle background
- `border border-white/20` - Visible border
- `focus-visible:border-sky-400` - Sky blue border on focus
- `focus-visible:ring-sky-500/50` - Sky blue ring on focus
- `shadow-[0_10px_30px_rgba(2,132,199,0.15)]` - Subtle colored shadow

### Text Input

```html
<input
  type="text"
  class="w-full bg-white/5 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 rounded-md px-3 py-2 transition"
/>
```

### Checkbox

```html
<input
  type="checkbox"
  class="h-4 w-4 rounded border-white/20 bg-white/5 backdrop-blur-sm accent-sky-500 focus:ring-sky-500/50 focus:ring-2"
/>
```

### Select/Dropdown Input

```html
<select class="w-full bg-white/5 backdrop-blur-sm border border-white/20 text-white focus:border-sky-400 focus:ring-sky-500/50 rounded-md px-3 py-2">
  <option>Option 1</option>
</select>
```

---

## Table Styling

### Table Container

```html
<div class="rounded-[20px] border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-sm shadow-lg overflow-hidden">
  <table class="w-full">
    <!-- Table content -->
  </table>
</div>
```

### Table Header

```html
<thead class="bg-white/5 border-b border-white/10">
  <tr>
    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
      Header
    </th>
  </tr>
</thead>
```

### Table Row

```html
<tbody>
  <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
    <td class="px-4 py-3 text-sm text-white/80">
      Cell content
    </td>
  </tr>
</tbody>
```

---

## Dropdown & Menu Styling

### Dropdown Menu Button

```html
<button class="w-full sm:w-auto border border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm shadow-[0_10px_30px_rgba(139,92,246,0.15)] rounded-md px-4 py-2 flex items-center gap-2">
  <Filter class="h-4 w-4" />
  Filters
  <span class="ml-2 h-2 w-2 rounded-full bg-primary"></span>
  <!-- Active indicator -->
</button>
```

### Dropdown Menu Content

```html
<div class="w-56 bg-popover/50 backdrop-blur-sm border border-white/10 text-white rounded-md shadow-lg p-1">
  <div class="px-2 py-1.5 text-sm font-semibold text-white/80">
    Menu Label
  </div>
  <div class="border-t border-white/10 my-1"></div>
  <div class="px-2 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded cursor-pointer">
    Menu Item
  </div>
</div>
```

**Key Classes**:
- `bg-popover/50` - Semi-transparent background
- `border border-white/10` - Subtle border
- Hover states: `hover:bg-white/10 hover:text-white`

### Menu Item (Checkbox)

```html
<div class="px-2 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded flex items-center gap-2 cursor-pointer">
  <input type="checkbox" class="h-4 w-4" />
  <span>Menu Item</span>
</div>
```

---

## Filter & Search Components

### Filter Bar Container (Responsive)

```html
<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
  <!-- Search Input -->
  <div class="relative flex-1 sm:max-w-sm">
    <!-- Input with icon -->
  </div>
  
  <!-- Filter Buttons -->
  <div class="flex items-center gap-2">
    <!-- Filter buttons -->
  </div>
</div>
```

### Filter Button (Active State)

```html
<button class="bg-sky-500/20 text-sky-400 border border-sky-400/30 hover:bg-sky-500/30 px-3 py-1.5 rounded-md text-sm font-medium transition">
  All
</button>
```

### Filter Button (Inactive State)

```html
<button class="border border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-medium transition">
  Active
</button>
```

### Active Filters Display

```html
<div class="flex items-center gap-2 mb-6 flex-wrap">
  <!-- Filter badges (see Badge Styling section) -->
  <button class="text-sm hover:text-destructive transition-colors">
    Clear All
  </button>
</div>
```

---

## Shadows & Effects

### Shadow Patterns by Component Type

#### Card Shadows (Large)

- **Sky**: `shadow-[0_30px_80px_rgba(2,132,199,0.35)]`
- **Emerald**: `shadow-[0_30px_80px_rgba(16,185,129,0.3)]`
- **Amber**: `shadow-[0_30px_80px_rgba(245,158,11,0.25)]`
- **Rose**: `shadow-[0_30px_80px_rgba(225,29,72,0.35)]`
- **Violet**: `shadow-[0_30px_80px_rgba(139,92,246,0.35)]`
- **Blue**: `shadow-[0_30px_80px_rgba(59,130,246,0.35)]`

#### Button Shadows (Medium)

- **Primary**: `shadow-[0_15px_35px_rgba(59,130,246,0.45)]`
- **Destructive**: `shadow-[0_15px_35px_rgba(225,29,72,0.45)]`

#### Badge/Filter Shadows (Small)

- **Sky**: `shadow-[0_10px_30px_rgba(2,132,199,0.2)]`
- **Emerald**: `shadow-[0_10px_30px_rgba(16,185,129,0.2)]`
- **Amber**: `shadow-[0_10px_30px_rgba(245,158,11,0.2)]`
- **Violet**: `shadow-[0_10px_30px_rgba(139,92,246,0.2)]`
- **Input**: `shadow-[0_10px_30px_rgba(2,132,199,0.15)]`

#### Header Shadows

- **Sticky Header**: `shadow-[0_10px_30px_rgba(15,23,42,0.25)]`

#### Standard Shadows

- **Small**: `shadow-xs`
- **Medium**: `shadow-lg`
- **Large**: `shadow-xl`

---

## Transparency & Blur

### Backdrop Blur Levels

- `backdrop-blur-sm` - Subtle blur (most common)
- `backdrop-blur-xl` - Strong blur (headers, sidebars)
- `backdrop-blur-2xl` - Very strong blur (sticky headers)

### Background Opacity Patterns

#### Card Backgrounds
- `bg-white/5` - Very subtle
- `bg-white/10` - Light (buttons, hover states)
- `bg-popover/50` - Medium (dropdowns, menus)
- `bg-background/50` - Medium (outline buttons)
- `bg-background/85` - High (sticky headers)

#### Border Opacity
- `border-white/10` - Standard borders
- `border-white/20` - More visible borders (inputs, hover)
- `border-color-400/30` - Colored borders (cards, badges)
- `border-color-300/40` - Colored borders (buttons, hover)

#### Text Opacity
- `text-white/40` - Placeholders
- `text-white/60` - Secondary text, labels
- `text-white/70` - Descriptions, muted text
- `text-white/80` - Body text
- `text-white` - Primary text (100% opacity)

---

## Border Patterns

### Border Radius

- `rounded-md` - 6px (buttons, inputs, small elements)
- `rounded-[20px]` - 20px (project cards, tables)
- `rounded-[28px]` - 28px (stat cards, main cards)
- `rounded-xl` - 12px (buttons)
- `rounded-full` - 50% (badges, icons)

### Border Styles

```css
/* Standard border */
border border-white/10

/* Colored border */
border border-sky-400/30

/* Hover border */
hover:border-white/20
hover:border-sky-300/50
```

---

## Responsive Design

### Breakpoint Strategy

- **Mobile First**: Base styles for mobile
- **sm:** (640px+) - Tablets and up
- **md:** (768px+) - Desktop
- **lg:** (1024px+) - Large desktop

### Common Responsive Patterns

#### Flex Direction

```html
<div class="flex flex-col sm:flex-row sm:items-center gap-3">
  <!-- Stacks on mobile, row on desktop -->
</div>
```

#### Width

```html
<div class="w-full sm:max-w-sm">
  <!-- Full width on mobile, constrained on desktop -->
</div>
```

#### Visibility

```html
<div class="hidden sm:flex">
  <!-- Hidden on mobile, visible on desktop -->
</div>

<div class="flex sm:hidden">
  <!-- Visible on mobile, hidden on desktop -->
</div>
```

#### Spacing

```html
<div class="p-4 sm:p-6">
  <!-- Less padding on mobile -->
</div>

<div class="gap-2 sm:gap-4">
  <!-- Smaller gaps on mobile -->
</div>
```

---

## Complete Component Examples

### Full Stat Card Example

```html
<!-- Sky Variant (Total Employees) -->
<article class="group rounded-[28px] border border-sky-400/30 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 p-6 shadow-[0_30px_80px_rgba(2,132,199,0.35)] backdrop-blur-sm transition hover:border-sky-300/50">
  <div class="flex items-start justify-between gap-4">
    <div>
      <p class="text-xs uppercase tracking-[0.45em] text-white/60">
        Total Employees
      </p>
      <p class="mt-3 text-3xl font-semibold text-white">
        150
      </p>
    </div>
  </div>
  <p class="mt-4 text-sm text-white/70">
    Track your entire organisation workforce across locations.
  </p>
</article>

<!-- Emerald Variant (Total Projects) -->
<article class="group rounded-[28px] border border-emerald-400/30 bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-emerald-500/5 p-6 shadow-[0_30px_80px_rgba(16,185,129,0.3)] backdrop-blur-sm transition hover:border-emerald-300/50">
  <div class="flex items-start justify-between gap-4">
    <div>
      <p class="text-xs uppercase tracking-[0.45em] text-white/60">
        Total Projects
      </p>
      <p class="mt-3 text-3xl font-semibold text-white">
        42
      </p>
    </div>
  </div>
  <p class="mt-4 text-sm text-white/70">
    Monitor project health and velocity with real-time status.
  </p>
</article>

<!-- Amber Variant (Active Project Employees) -->
<article class="group rounded-[28px] border border-amber-400/30 bg-gradient-to-br from-amber-500/30 via-amber-500/15 to-amber-500/5 p-6 shadow-[0_30px_80px_rgba(245,158,11,0.25)] backdrop-blur-sm transition hover:border-amber-300/60">
  <div class="flex items-start justify-between gap-4">
    <div>
      <p class="text-xs uppercase tracking-[0.45em] text-white/60">
        Active Project Employees
      </p>
      <p class="mt-3 text-3xl font-semibold text-white">
        89
      </p>
    </div>
  </div>
  <p class="mt-4 text-sm text-white/70">
    Know exactly who is booked and where the next gaps appear.
  </p>
</article>
```

### Full Button Example

```html
<!-- Primary Button -->
<button type="button" class="inline-flex items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-r from-primary/70 via-primary/50 to-primary/30 px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(59,130,246,0.45)] backdrop-blur-sm transition duration-200 hover:border-primary/40 hover:from-primary/80 hover:via-primary/60 hover:to-primary/40">
  Primary Action
</button>

<!-- Destructive Button (Logout) -->
<button type="button" class="inline-flex items-center justify-center rounded-xl border border-rose-400/30 bg-gradient-to-r from-rose-500/70 via-rose-500/50 to-rose-500/30 px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(225,29,72,0.45)] backdrop-blur-sm transition duration-200 hover:border-rose-300/40 hover:from-rose-500/80 hover:via-rose-500/60 hover:to-rose-500/40">
  Log out
</button>
```

### Full Page Background Example

```html
<div class="app-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)]">
  <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),transparent_60%)]"></div>
  <div class="relative z-10 flex min-h-screen flex-col">
    <header class="sticky top-0 z-20 border-b border-white/10 bg-background/85 backdrop-blur-2xl shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
      <!-- Header content -->
    </header>
    <main class="flex-grow">
      <!-- Main content -->
    </main>
    <footer class="border-t border-white/10 bg-background/80 backdrop-blur-xl">
      <!-- Footer content -->
    </footer>
  </div>
</div>
```

---

## Quick Reference Cheat Sheet

### Color Variant Quick Reference

| Variant | Border | Gradient Start | Gradient Middle | Gradient End | Shadow RGBA |
|---------|--------|----------------|-----------------|--------------|-------------|
| Sky | `border-sky-400/30` | `from-sky-500/25` | `via-sky-500/10` | `to-sky-500/5` | `rgba(2,132,199,0.35)` |
| Emerald | `border-emerald-400/30` | `from-emerald-500/25` | `via-emerald-500/10` | `to-emerald-500/5` | `rgba(16,185,129,0.3)` |
| Amber | `border-amber-400/30` | `from-amber-500/30` | `via-amber-500/15` | `to-amber-500/5` | `rgba(245,158,11,0.25)` |
| Rose | `border-rose-400/30` | `from-rose-500/25` | `via-rose-500/10` | `to-rose-500/5` | `rgba(225,29,72,0.35)` |
| Violet | `border-violet-400/30` | `from-violet-500/25` | `via-violet-500/10` | `to-violet-500/5` | `rgba(139,92,246,0.35)` |
| Blue | `border-blue-400/30` | `from-blue-500/25` | `via-blue-500/10` | `to-blue-500/5` | `rgba(59,130,246,0.35)` |

### Common Class Combinations

```html
<!-- Glassmorphism Card -->
<div class="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-sm shadow-lg p-6">

<!-- Colored Card -->
<article class="rounded-[28px] border border-sky-400/30 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 shadow-[0_30px_80px_rgba(2,132,199,0.35)] backdrop-blur-sm">

<!-- Primary Button -->
<button class="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/70 via-primary/50 to-primary/30 shadow-[0_15px_35px_rgba(59,130,246,0.45)] backdrop-blur-sm">

<!-- Input Field -->
<input class="bg-white/5 backdrop-blur-sm border border-white/20 focus-visible:border-sky-400 focus-visible:ring-sky-500/50">

<!-- Badge -->
<span class="border border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/10 to-emerald-500/5 backdrop-blur-sm shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
```

---

## Notes & Best Practices

1. **Always use `backdrop-blur-sm`** on cards, inputs, buttons, and badges for glassmorphism
2. **Consistent opacity scale** - Use `/5`, `/10`, `/20`, `/25`, `/30`, `/40`, `/50`, `/70`, `/80`, `/85`
3. **Color-coded shadows** - Match shadow colors to component colors
4. **Hover states** - Always include hover states with increased opacity or brighter borders
5. **Responsive first** - Design mobile-first, enhance for larger screens
6. **Semantic colors** - Use color variants to convey meaning (sky=info, emerald=success, amber=warning, rose=error)
7. **Transition effects** - Add `transition` or `transition-all` to interactive elements
8. **Border radius consistency** - Use `rounded-[28px]` for cards, `rounded-[20px]` for list items, `rounded-md` for buttons/inputs

---

**Last Updated**: Based on feedback-widget project styling patterns
**Framework**: Tailwind CSS with custom opacity values and colored shadows

