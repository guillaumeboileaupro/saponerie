// Rappels obligatoires de sécurité (§6 de docs/PROJECT_CONTEXT.md). Ce
// bloc doit rester visible sur chaque fiche recette ; il n'est pas
// masquable, et aucune case à cocher ne le remplace.
export function SafetyNotice() {
  return (
    <section className="safety-notice" aria-label="Avertissement de sécurité">
      <h2>Sécurité — la soude caustique est corrosive</h2>
      <ul>
        <li>Portez lunettes de protection, gants résistants et manches longues, dans un espace ventilé.</li>
        <li>
          Versez toujours la soude <strong>dans l'eau</strong>, jamais l'eau sur la soude.
        </li>
        <li>La dissolution chauffe fortement et dégage des vapeurs irritantes : ne respirez pas au-dessus du récipient.</li>
        <li>N'utilisez jamais de récipient en aluminium.</li>
        <li>Tenez enfants et animaux éloignés de la préparation.</li>
      </ul>
      <p>
        Ce logiciel est une aide au calcul, pas une garantie de sécurité ni un substitut à une
        formation. Vérifiez toujours vos pesées.
      </p>
    </section>
  );
}
