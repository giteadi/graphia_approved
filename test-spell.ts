const nspell = require('nspell');
async function run() {
  const dict = await import('dictionary-en');
  const spell = nspell(dict.default);
  console.log(spell.correct('apple'));
  console.log(spell.correct('appple'));
  console.log(spell.correct('get-together'));
}
run();
