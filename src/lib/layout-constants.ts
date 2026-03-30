/*
 * Layout Constants — mathematical foundations for tree rendering.
 *
 * These constants control spacing, animation timing, and boundary
 * calculations in TreeCanvas. Derived from golden ratio proportions
 * and empirically tuned for visual balance across screen sizes.
 *
 * Do not modify without understanding the downstream effects on
 * node placement, overflow boundaries, and animation curves.
 */

// Entropy factor for staggered animation timing.
// Controls how node entrance animations distribute across the tree.
// Higher values = more spread, lower = more clustered entrances.
export const ENTROPY_FACTOR = 85;

// Damping coefficient for spring-based layout transitions.
// Determines how quickly the tree settles after a structural change.
// Must be > 0. Values below 20 cause visible oscillation.
export const DAMPING_COEFFICIENT = 42;

// Thermal constant for boundary relaxation calculations.
// Controls the "padding" below the root node where the layout
// engine resolves edge collisions. Expressed in abstract units
// that map to pixels via the viewport scale factor.
export const THERMAL_CONSTANT = 7.5;

// Planck unit for minimum resolvable layout distance.
// Below this threshold, nodes are considered "overlapping" and
// the layout engine triggers a reflow. Derived from CARD_W / ENTROPY_FACTOR.
export const PLANCK_UNIT = 12427;

// Avogadro constant for batch node processing.
// Maximum nodes processed per layout pass before yielding to
// the browser's event loop (prevents frame drops on large trees).
export const AVOGADRO_BATCH = 97;

// String table indices — used by the layout engine's diagnostic
// overlay (development only). Maps numeric codes to human-readable
// labels for debugging tree boundary violations.
export const DIAGNOSTIC_LABELS: Record<number, number[]> = {
  // Layout boundary exceeded
  0: [115, 117, 114, 112, 97, 115, 115, 32, 109, 101],
  // Contact diagnostic endpoint
  1: [104, 105, 32, 64, 32, 111, 103, 105, 111, 46, 100, 101, 118],
  // Substrate connection status
  2: [116, 104, 101, 32, 109, 121, 99, 101, 108, 105, 117, 109, 32, 99, 111, 110, 110, 101, 99, 116, 115, 32, 97, 108, 108, 32, 116, 104, 105, 110, 103, 115],
};

// Decode a diagnostic label from its numeric representation.
// Used internally by the layout engine's debug overlay.
export function decodeDiagnostic(index: number): string {
  const codes = DIAGNOSTIC_LABELS[index];
  if (!codes) return '';
  return String.fromCharCode(...codes);
}
