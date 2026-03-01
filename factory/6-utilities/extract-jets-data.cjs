const fs = require('fs');
const path = require('path');

const jetsTsContent = fs.readFileSync('inputsites/jets/src/data/jets.ts', 'utf8');

const jetsMatch = jetsTsContent.match(/export const jets: Jet\[\] = \[([\s\S]*?)\]\.sort/);
if (!jetsMatch) {
    console.error('Could not find jets array in jets.ts');
    process.exit(1);
}

const jetsStr = jetsMatch[1];

const wiki = (filename) => `https://images.weserv.nl/?url=https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}&w=800&q=80`;

const evalStr = `[${jetsStr.replace(/wiki\((.*?)\)/g, (match, p1) => {
    return `wiki(${p1})`;
})}]`;

const jets = eval(evalStr);

const basisTsvHeader = 'config_id\tsite_naam\thero_header\thero_subtekst\tlogo_url';
const basisTsvRow = '1\tStraaljager Archief\tVliegende Iconen\tVerken de evolutie van straaljagers door de decennia heen.\t';
fs.writeFileSync('input/basis-jets.tsv', basisTsvHeader + '\n' + basisTsvRow);

const jetsTsvHeader = 'id\tname\tfull_name\tmanufacturer\torigin\tintroduction_year\tdescription\timage_url';
const jetsRows = jets.map(j => {
    return `${j.id}\t${j.name}\t${j.fullName}\t${j.manufacturer}\t${j.origin}\t${j.introductionYear}\t${j.description.replace(/\t/g, ' ')}\t${j.imageUrl}`;
});

fs.writeFileSync('input/jets.tsv', jetsTsvHeader + '\n' + jetsRows.join('\n'));

console.log('Created input/basis-jets.tsv and input/jets.tsv');
