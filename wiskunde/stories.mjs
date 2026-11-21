export const settings = [
  { nl: ['camping', 'dagen', 'Kosten', '€'], en: ['campsite', 'days', 'Cost', '€'] },
  { nl: ['fietsverhuur', 'uren', 'Kosten', '€'], en: ['bike rental', 'hours', 'Cost', '€'] },
  { nl: ['spaarpot', 'weken', 'Spaargeld', '€'], en: ['savings jar', 'weeks', 'Savings', '€'] },
];

export function story(p, lang) {
  const nl = lang === 'nl';
  if (p.kind === 'age') {
    const name = p.askOlder ? 'Sam' : 'Noor';
    const date = nl ? (p.shift < 0 ? `${-p.shift} jaar geleden` : `over ${p.shift} jaar`) :
      (p.shift < 0 ? `${-p.shift} years ago` : `in ${p.shift} years`);
    return nl
      ? `Sam is ${p.gap} jaar ouder dan Noor. Hun leeftijden samen zijn ${date} precies ${p.total} jaar. Hoe oud is ${name} nu?`
      : `Sam is ${p.gap} years older than Noor. Their ages add up to ${p.total} ${date}. How old is ${name} now?`;
  }
  const [, time] = settings[p.setting][lang];
  const setup = [
    { nl: 'Je gaat een paar dagen kamperen met je gezin.', en: 'You’re going camping with your family for a few days.' },
    { nl: 'Je huurt een fiets voor een middag.', en: 'You rent a bike for an afternoon.' },
    { nl: 'Je spaart voor iets dat je graag wilt kopen.', en: 'You’re saving up for something you’d like to buy.' },
  ][p.setting][lang];
  const graphContext = [
    { nl: 'De grafiek laat zien hoeveel je betaalt voor je verblijf.', en: 'The graph shows how much you pay for your stay.' },
    { nl: 'De grafiek laat zien hoeveel de huur kost.', en: 'The graph shows how much it costs to rent the bike.' },
    { nl: 'De grafiek laat zien hoeveel geld er in je spaarpot zit.', en: 'The graph shows how much money is in your savings jar.' },
  ][p.setting][lang];
  if (p.kind === 'duration') {
    if (p.setting === 2) return nl
      ? `${setup} In je spaarpot zit €${p.b}. Elke week komt er €${p.rate} bij. Na hoeveel weken zit er €${p.total} in?`
      : `${setup} Your savings jar starts with €${p.b}. You add €${p.rate} each week. After how many weeks will it hold €${p.total}?`;
    const period = p.setting === 0 ? (nl ? 'dag' : 'day') : (nl ? 'uur' : 'hour');
    return nl
      ? `${setup} Je betaalt €${p.b} vooraf en €${p.rate} per ${period}. Voor hoeveel ${time} betaal je in totaal €${p.total}?`
      : `${setup} You pay €${p.b} upfront and €${p.rate} per ${period}. How many ${time} does a total of €${p.total} cover?`;
  }
  return nl
    ? [`${setup} ${graphContext} Welk startbedrag lees je af? Wat betekent het?`,
      `Met hoeveel euro stijgt het bedrag per tijdseenheid? Wat betekent dat hier?`,
      `Schrijf de formule. Het ${p.changeRate ? 'bedrag per tijdseenheid' : 'startbedrag'} wordt €${p.changed}. Schrijf de nieuwe formule en teken de nieuwe lijn.`]
    : [`${setup} ${graphContext} What starting amount can you read from it? What does it mean?`,
      `By how many euros does the amount rise per unit of time? What does that mean here?`,
      `Write the formula. The ${p.changeRate ? 'amount per unit of time' : 'starting amount'} changes to €${p.changed}. Write the new formula and draw the new line.`];
}
