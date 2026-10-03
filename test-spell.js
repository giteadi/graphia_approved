import nspell from 'nspell';
import en from 'dictionary-en';
const spell = nspell(en);
console.log(spell.correct('apple'));
console.log(spell.correct('appple'));
console.log(spell.correct('get-together'));
console.log(spell.suggest('appple'));
