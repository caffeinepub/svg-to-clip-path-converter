# Specification

## Summary
**Goal:** Make SVG path → clip-path: polygon() conversion universal and robust by fixing path tokenization/parsing and improving curve/arc flattening, while keeping clip-path: path('...') output always available.

**Planned changes:**
- Fix SVG path tokenizer/parser so command letters are never misread as numbers, and correctly parse SVG numeric formats (negative signs without spaces, decimals, scientific notation) with optional comma/space separators.
- Expand polygon conversion support to additional SVG path commands (S/s, T/t, A/a) and improve curve/arc handling by flattening segments into a polyline approximation (not just endpoints), while preserving existing behaviors (repetition, implicit lineto after moveto, Z/z).
- Add a user-facing control to adjust polygon approximation quality (e.g., presets or “segments per curve”), with a sensible default; changes should recompute polygon output and update preview.
- Ensure clip-path: path('...') and clip-path: polygon(...) outputs remain independent so polygon conversion failures do not remove a successful path() output, and keep all user-facing errors/messages in English with parsing context.

**User-visible outcome:** Users can paste SVG paths (including adjacent commands, mixed separators, and varied number formats) and reliably get clip-path: path('...') plus an adjustable-quality polygon approximation that works for curves, smooth curves, and arcs, with clear English errors when inputs are malformed.
