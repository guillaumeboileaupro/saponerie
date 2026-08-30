import { formatDecimal } from "./formatDecimal";

interface BeeswaxControlProps {
  percent: string;
  massGrams: string | null;
  onChange: (percent: string) => void;
}

export function BeeswaxControl({ percent, massGrams, onChange }: BeeswaxControlProps) {
  return (
    <div className="beeswax-control">
      <div>
        <span className="eyebrow">Calculée automatiquement</span>
        <h3>Cire d'abeille</h3>
        <p>{massGrams ? `${formatDecimal(massGrams)} g à ajouter` : "Ajoutez vos huiles pour obtenir la masse."}</p>
      </div>
      <label htmlFor="beeswax-percent">
        Taux
        <span className="percent-input">
          <input
            id="beeswax-percent"
            type="text"
            inputMode="decimal"
            value={percent}
            onChange={(event) => onChange(event.currentTarget.value)}
            aria-label="Pourcentage de cire d'abeille"
          />
          <span>%</span>
        </span>
      </label>
    </div>
  );
}
