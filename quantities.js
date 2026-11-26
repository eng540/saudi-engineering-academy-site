// Schematic quantity helpers for the first learning track. Pure functions, no dependencies.
// SCOPE: arithmetic on geometry the learner supplies. These are NOT detailing, bar-bending-schedule or design tools.
// Units: lengths in metres (m) except bar diameter in millimetres (mm). Mass in kg, area in m2, volume in m3.
// Rounding: results are rounded half away from zero to 4 decimals (mass: 3 decimals). Round only at display in real work.
// Cover, hook allowance and lap lengths are INPUTS from the drawing notes or governing code clause; none is hard-coded.
const STEEL_DENSITY = 7850; // kg/m3 ASSUMED illustrative density for steel (no source linked here); confirm against the project specification.

function pos(name, v) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) throw new RangeError(name + ' must be a finite number > 0');
  return v;
}
function nonneg(name, v) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new RangeError(name + ' must be a finite number >= 0');
  return v;
}
function intCount(name, v) {
  if (!Number.isInteger(v) || v < 1) throw new RangeError(name + ' must be an integer >= 1');
  return v;
}
function round(x, n) { const p = Math.pow(10, n); return Math.sign(x) * Math.round(Math.abs(x) * p) / p; }

// Volume of a prismatic (rectangular) element x count. No deductions for openings, overlaps or voids.
function rectConcreteVolume(length, width, depth, count = 1) {
  return round(pos('length', length) * pos('width', width) * pos('depth', depth) * intCount('count', count), 4);
}
function circularColumnVolume(diameter, height, count = 1) {
  pos('diameter', diameter); pos('height', height); intCount('count', count);
  return round(Math.PI * diameter * diameter / 4 * height * count, 4);
}
// Mass per metre of a plain round bar (nominal diameter, mm): pi*d^2/4 * density. Ribbed-bar nominal mass can differ slightly.
function barMassPerMetre(diameterMm) {
  const d = pos('diameterMm', diameterMm) / 1000;
  return round(Math.PI * d * d / 4 * STEEL_DENSITY, 4);
}
function rebarMass(totalLengthM, diameterMm) {
  return round(pos('totalLengthM', totalLengthM) * barMassPerMetre(diameterMm), 3);
}
// Number of stirrup positions over a zone of the given length. The convention MUST be chosen explicitly:
//  'floor+1': first at the zone start, then every `spacing`; the last is at or before the zone end (last gap may be shorter or exactly spacing).
//  'ceil'   : enough bars so the gap count is ceil(L/s) and the first bar sits one spacing in (no bar on the start line).
//  'ceil+1' : first at the start and a bar on the end line; spacing is reduced to fit (actual spacing <= given).
// Which convention applies is a drawing/specification question. Do not assume one.
function stirrupCount(length, spacing, convention) {
  pos('length', length); pos('spacing', spacing);
  const ratio = Math.round(length / spacing * 1e9) / 1e9; // absorbs float noise such as 0.6/0.2
  switch (convention) {
    case 'floor+1': return Math.floor(ratio) + 1;
    case 'ceil': return Math.ceil(ratio);
    case 'ceil+1': return Math.ceil(ratio) + 1;
    default: throw new RangeError("convention must be 'floor+1', 'ceil' or 'ceil+1'");
  }
}
// SCHEMATIC length of a closed rectangular stirrup. NOT a bar-bending-schedule cut length.
// section b x h are the concrete outer dimensions. cover is the clear cover to the stirrup's outer face.
// dimension 'outer' : perimeter measured on the stirrup's outer face. 'centreline': perimeter on the bar centreline (needs barDiameterMm).
// hookAllowance is the TOTAL extra length for both hooks, supplied by the learner (m). No bend deductions or bend radii are applied;
// a real cut length needs the code/standard bending shape, bar diameter and bend geometry.
function stirrupSchematicLength(b, h, cover, hookAllowance, dimension = 'outer', barDiameterMm) {
  pos('b', b); pos('h', h); pos('cover', cover); nonneg('hookAllowance', hookAllowance);
  let w = b - 2 * cover, d = h - 2 * cover;
  if (dimension === 'centreline') {
    const t = pos('barDiameterMm', barDiameterMm) / 1000;
    w -= t; d -= t;
  } else if (dimension !== 'outer') {
    throw new RangeError("dimension must be 'outer' or 'centreline'");
  }
  if (w <= 0 || d <= 0) throw new RangeError('cover (and bar diameter) leave no positive stirrup dimension');
  return round(2 * (w + d) + hookAllowance, 4);
}
// Beam formwork: two sides + soffit over the full length. No end faces, no deduction for slab/column junctions.
function beamFormworkArea(length, width, depth, count = 1) {
  return round((2 * pos('depth', depth) + pos('width', width)) * pos('length', length) * intCount('count', count), 4);
}

const api = { STEEL_DENSITY, rectConcreteVolume, circularColumnVolume, barMassPerMetre, rebarMass, stirrupCount, stirrupSchematicLength, beamFormworkArea };
if (typeof module !== 'undefined') module.exports = api; else window.Quantities = api;
