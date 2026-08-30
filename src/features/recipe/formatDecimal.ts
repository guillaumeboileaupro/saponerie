/**
 * Arrondit une chaîne décimale pour l'affichage, sans jamais passer par un
 * flottant binaire (§4.5 de docs/PROJECT_CONTEXT.md : le moteur conserve
 * une précision élevée — une division comme NaOH/pureté peut produire un
 * développement décimal très long — et seul l'affichage arrondit).
 * Arrondi « à la moitié supérieure » (0,05 → 0,1).
 */
export function formatDecimal(value: string, decimals = 1): string {
  const negative = value.startsWith("-");
  const absValue = negative ? value.slice(1) : value;
  const [intPart, fracPart = ""] = absValue.split(".");

  const paddedFrac = fracPart.padEnd(decimals + 1, "0");
  const keptFrac = paddedFrac.slice(0, decimals);
  const roundUp = Number(paddedFrac.charAt(decimals)) >= 5;

  const digits = `${intPart}${keptFrac}`.split("").map(Number);
  if (roundUp) {
    let i = digits.length - 1;
    while (i >= 0) {
      digits[i] += 1;
      if (digits[i] === 10) {
        digits[i] = 0;
        i -= 1;
      } else {
        break;
      }
    }
    if (i < 0) {
      digits.unshift(1);
    }
  }

  const digitStr = digits.join("");
  const intLen = digitStr.length - decimals;
  const roundedInt = digitStr.slice(0, intLen) || "0";
  const roundedFrac = digitStr.slice(intLen);
  const magnitude = decimals > 0 ? `${roundedInt}.${roundedFrac}` : roundedInt;

  return negative && Number(magnitude) !== 0 ? `-${magnitude}` : magnitude;
}
