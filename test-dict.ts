import nspell from 'nspell';
import en from 'dictionary-en';
const spell = nspell(en);
console.log(spell.correct('apple'));
