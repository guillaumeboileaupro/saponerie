/**
 * Arithmétique décimale exacte pour des calculs métier côté UI (ex. masse
 * de cire d'abeille dérivée d'un pourcentage des autres corps gras). Basée
 * sur BigInt, jamais sur `number`, pour rester cohérent avec l'exigence de
 * §4 de docs/PROJECT_CONTEXT.md : ne jamais faire de calcul métier avec un
 * flottant binaire. Contrairement à `formatDecimal.ts` (arrondi
 * d'affichage), ces fonctions produisent des valeurs exactes destinées à
 * être renvoyées au moteur Rust.
 */

interface ScaledValue {
  digits: bigint;
  scale: number;
}

function parseDecimal(value: string): ScaledValue {
  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  const abs = negative ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart = ""] = abs.split(".");
  const digits = BigInt((intPart || "0") + fracPart) * (negative ? -1n : 1n);
  return { digits, scale: fracPart.length };
}

function formatScaled({ digits, scale }: ScaledValue): string {
  const negative = digits < 0n;
  const abs = negative ? -digits : digits;
  const str = abs.toString().padStart(scale + 1, "0");
  if (scale === 0) {
    return (negative ? "-" : "") + str;
  }
  const intPart = str.slice(0, str.length - scale);
  const fracPart = str.slice(str.length - scale);
  return (negative ? "-" : "") + intPart + "." + fracPart;
}

export function addDecimal(a: string, b: string): string {
  const A = parseDecimal(a);
  const B = parseDecimal(b);
  const scale = Math.max(A.scale, B.scale);
  const aScaled = A.digits * 10n ** BigInt(scale - A.scale);
  const bScaled = B.digits * 10n ** BigInt(scale - B.scale);
  return formatScaled({ digits: aScaled + bScaled, scale });
}

export function sumDecimals(values: string[]): string {
  return values.reduce((total, value) => addDecimal(total, value), "0");
}

/** Calcule `percent`% de `value` (ex. percentOf("300", "4") = "12"). */
export function percentOf(value: string, percent: string): string {
  const V = parseDecimal(value);
  const P = parseDecimal(percent);
  // value × percent / 100 : on multiplie les chiffres et on ajoute 2 au
  // total des décimales (division exacte par 100, puissance de dix).
  return formatScaled({ digits: V.digits * P.digits, scale: V.scale + P.scale + 2 });
}
