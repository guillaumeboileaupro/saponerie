import type { WaterModeKind } from "./state";

interface WaterModeOption {
  kind: WaterModeKind;
  label: string;
  hint: string;
  unit: string;
}

const OPTIONS: WaterModeOption[] = [
  {
    kind: "percentOfOils",
    label: "Pourcentage des corps gras",
    hint: "Eau = % × masse totale des corps gras",
    unit: "%",
  },
  {
    kind: "concentration",
    label: "Concentration de la solution de soude",
    hint: "Eau = NaOH × (1 − c) / c",
    unit: "",
  },
  {
    kind: "waterLyeRatio",
    label: "Ratio eau / soude",
    hint: "Eau = NaOH × ratio",
    unit: "",
  },
];

interface WaterModeSelectorProps {
  kind: WaterModeKind;
  value: string;
  onChange: (kind: WaterModeKind, value: string) => void;
}

export function WaterModeSelector({ kind, value, onChange }: WaterModeSelectorProps) {
  return (
    <fieldset className="water-mode">
      <legend>Méthode de calcul de l'eau</legend>
      {OPTIONS.map((option) => {
        const inputId = `water-mode-${option.kind}`;
        const checked = kind === option.kind;
        return (
          <div className="water-mode-option" key={option.kind}>
            <label>
              <input
                type="radio"
                name="water-mode"
                checked={checked}
                onChange={() => onChange(option.kind, value)}
              />
              {option.label}
            </label>
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              aria-label={`Valeur pour ${option.label}`}
              disabled={!checked}
              value={checked ? value : ""}
              onChange={(event) => onChange(option.kind, event.currentTarget.value)}
              placeholder={option.unit || "valeur"}
            />
            <p className="field-hint">{option.hint}</p>
          </div>
        );
      })}
    </fieldset>
  );
}
