# Design System & Visual Language

## 1. Visual Identity: "Modern Precision"
- **Aesthetic**: Minimalist, high-contrast, and functional. Think "Linear" or "Vercel" meets "Apple."
- **Surfaces**: Use subtle borders (`1px`) and micro-shadows rather than heavy gradients.
- **Radius**: Standardize on `8px` (medium) for buttons/cards and `9999px` for pill-shaped badges.

## 2. Color Palette (Tailwind Tokens)
- **Primary**: Indigo/Violet-600 for actions.
- **Surface**: Pure White (#FFFFFF) or Slate-50 for light mode; Slate-950 for dark mode.
- **Accents**: Use Emerald for success, Rose for errors, and Amber for warnings.
- **Text**: Slate-900 (High Emphasis), Slate-500 (Medium/Muted), Slate-400 (Disabled).

## 3. Typography
- **Headings**: Sans-serif, tight letter-spacing (`tracking-tight`), Semi-bold to Bold.
- **Body**: Standard sans-serif (Inter/Geist), `leading-relaxed` for readability.
- **Mono**: Use for code snippets, IDs, or technical data (JetBrains Mono/Geist Mono).

## 4. Components & Interactive States
- **Buttons**: Clear hover states (darken 10%) and active "press" scales (`scale-95`).
- **Inputs**: Focus rings should use the Primary color with a `2px` offset.
- **Empty States**: Use `nano_banana` to generate high-fidelity, monochromatic 3D illustrations for empty dashboards.

## 5. Animation (Motion)
- **Duration**: Fast (200ms) for UI transitions; Slower (500ms) for page entrances.
- **Easing**: Use `ease-in-out` for most transitions to feel natural.
- **Feedback**: Loading states should use skeleton screens, not generic spinners.
