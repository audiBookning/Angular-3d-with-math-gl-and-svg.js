// app constants
export const SCALEDefaultCONSTANT = 40;

/* ******************* */
// utils
const TAU = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;
// utils - methods
const degToRad = (angle: number) => angle * DEG_TO_RAD;
const radToDeg = (angle: number) => angle * (180 / Math.PI);
