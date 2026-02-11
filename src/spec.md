# Specification

## Summary
**Goal:** Add a visual preview for both the user’s SVG path input and the generated CSS clip-path output.

**Planned changes:**
- Add an “Input Preview” mode that renders the user-provided SVG path (`d` attribute) inside an `<svg>` element, updating live and showing an empty/placeholder state for empty/invalid input.
- Update the preview UI to allow switching between “Input Preview” and “Output Preview” (with “Output Preview” retaining the existing path()/polygon() format switching).
- Pass the raw `svgPath` state from `ConverterSection` down into `PreviewSection` via updated props/types, using it only for input rendering.

**User-visible outcome:** Users can toggle between seeing a live preview of their SVG path input and the existing clip-path output preview without changing the generated output values.
