---
name: LuxeStay Pro
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'
  tertiary: '#111516'
  on-tertiary: '#ffffff'
  tertiary-container: '#26292b'
  on-tertiary-container: '#8d9092'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  sidebar-width: 260px
  sidebar-collapsed: 72px
  header-height: 64px
---

## Brand & Style

The design system is engineered for the high-end hospitality sector, balancing the rigorous utility of a SaaS platform with the grace of a luxury hotel brand. The aesthetic is **Corporate Modern** with a **Minimalist** foundation, utilizing high-quality typography and generous whitespace to reduce cognitive load for hotel staff while maintaining a premium feel.

The target audience includes hotel managers, front-desk staff, and operations directors who require a reliable, professional environment. The UI should evoke a sense of calm authority, precision, and "invisible" service—where data is presented clearly but with a sophisticated editorial touch.

## Colors

The palette is anchored by **Deep Navy (Slate 800)** to provide a stable, professional foundation for navigation and primary actions. **Champagne Gold** is used sparingly as a high-contrast accent to highlight premium features, selected states, or "golden path" actions.

Backgrounds utilize a cool **Slate 50** to differentiate the canvas from white **Surface** containers (cards and modals). Semantic colors are tuned for high legibility against white backgrounds, ensuring that critical room statuses are identifiable at a glance without appearing neon or jarring.

## Typography

This design system uses a hybrid typographic approach. **Noto Serif** is reserved for headings and significant data points (like room numbers or guest names) to infuse the interface with an editorial, "concierge" feel. 

**Inter** handles all functional UI elements, data tables, and body copy to ensure maximum legibility and a modern, systematic character. Label styles utilize slightly increased letter spacing and semi-bold weights for clear categorization in dense administrative views.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid model**. A fixed-width collapsible sidebar sits on the left, with a fluid content area that expands to fill the viewport. The system uses an 8px grid (2 units) for most component spacing and a 4px grid for fine-tuning.

- **Desktop:** 12-column grid with 24px margins. Content is housed in "Surface" cards.
- **Tablet:** 8-column grid. Sidebar collapses to icon-only mode by default.
- **Mobile:** 4-column grid with 16px margins. Sidebar transitions to an off-canvas drawer.

Data-heavy tables should utilize "Comfortable" (16px) or "Compact" (8px) vertical padding roles depending on the volume of information.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**. This design system avoids harsh borders in favor of soft depth indicators:

1.  **Level 0 (Background):** Slate 50. The lowest plane.
2.  **Level 1 (Cards/Surface):** White background with a subtle 1px border (#E2E8F0) and a very soft, diffused shadow (Blur: 12px, Y: 4px, Opacity: 4% Black).
3.  **Level 2 (Dropdowns/Modals):** White background with a more pronounced shadow (Blur: 20px, Y: 10px, Opacity: 8% Black) to indicate temporary overlay status.

Interactive elements like buttons use a slight Y-axis shift on hover rather than heavy shadow changes to maintain a sophisticated feel.

## Shapes

The design system employs **Rounded (0.5rem)** corners as the standard for all primary UI components, including cards, input fields, and buttons. This radius strikes a balance between the precision of a professional tool and the approachability of a luxury service.

- **Small elements (Checkboxes):** 4px (Soft)
- **Standard elements (Buttons/Inputs):** 8px (Rounded)
- **Large elements (Cards/Containers):** 12px (rounded-lg)
- **Status Badges:** Pill-shaped (rounded-full) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Navy background, white text. No border.
- **Secondary:** White background, Navy border (1px), Navy text.
- **Accent:** Champagne Gold background, Slate 900 text. Reserved for high-value conversions (e.g., "Upgrade Stay").

### Data Tables
- Header row: Slate 50 background, Navy text, uppercase labels.
- Row hover: Subtle Slate 50 tint. 
- Dividers: 1px Slate 100 horizontal lines only.

### Status Badges
- Used for room states. Design as a pill with a light tinted background (10% opacity of the status color) and high-contrast text (100% opacity of the status color). For example, "Available" uses a light emerald background with dark emerald text.

### Inputs
- Height: 40px (Standard).
- Border: 1px Slate 200.
- Focus State: Border changes to Champagne Gold with a 2px soft outer glow.

### Room Cards
- Featured room cards should use Noto Serif for the room name/number.
- Use a vertical accent bar on the left edge of the card to indicate the current status color.