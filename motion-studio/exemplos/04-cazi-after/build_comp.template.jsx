// 04 CAZI S-EFX (plano PRO) — monta a comp 9x16 no After Effects.
// Gerado por make_jsx.mjs (edite este template e gere de novo; não edite build_comp.jsx à mão).
// Uso: File → Scripts → Run Script File… → build_comp.jsx (a pasta ae/ precisa ficar inteira ao lado do script).
// Camadas: sequências exportadas do filme HTML (base, sombras+overlays, títulos, interface) + títulos como
// TEXTO NATIVO (desligados: ligue para editar; pedem a fonte Inter instalada).
(function () {
/*__DATA__*/

var ROOT = (new File($.fileName)).parent.fsName;
var FPS = DATA.fps, DUR = DATA.dur, W = 1080, H = 1920;

function importSeq(path, folder, alpha) {
  var io = new ImportOptions(new File(path));
  io.sequence = true; io.forceAlphabetical = true;
  var it = app.project.importFile(io);
  it.mainSource.conformFrameRate = FPS;
  if (alpha) it.mainSource.alphaMode = AlphaMode.STRAIGHT;
  it.parentFolder = folder;
  return it;
}
function importOne(path, folder) {
  var it = app.project.importFile(new ImportOptions(new File(path)));
  it.parentFolder = folder;
  return it;
}

function buildLine(comp, blk, ln, idx) {
  var L = comp.layers.addText(ln.text);
  L.name = 'Título — ' + ln.text;
  var st = L.property('ADBE Text Properties').property('ADBE Text Document');
  var td = st.value;
  td.resetCharStyle(); td.resetParagraphStyle();
  td.font = 'Inter-ExtraBold';
  td.fontSize = ln.fs;
  td.applyFill = true; td.fillColor = [1, 1, 1];
  td.applyStroke = false;
  td.tracking = -35;
  td.justification = ParagraphJustification.CENTER_JUSTIFY;
  st.setValue(td);
  L.inPoint = blk.a; L.outPoint = blk.b;
  var tr = L.property('ADBE Transform Group');
  tr.property('ADBE Anchor Point').setValue([0, 0]);
  tr.property('ADBE Position').setValue([W / 2, ln.top + ln.fs * 0.86]);

  // cada palavra salta no tempo em que é dita (tempos em "Tempos das palavras")
  var times = [], acc = [];
  for (var i = 0; i < ln.words.length; i++) { times.push(ln.words[i].t); if (ln.words[i].acc) acc.push(i + 1); }
  var an = L.property('ADBE Text Properties').property('ADBE Text Animators').addProperty('ADBE Text Animator');
  an.name = 'Palavra a palavra';
  an.property('ADBE Text Animator Properties').addProperty('ADBE Text Opacity').setValue(0);
  an.property('ADBE Text Animator Properties').addProperty('ADBE Text Position 3D').setValue([0, -40, 0]);
  var sel = an.property('ADBE Text Selectors').addProperty('ADBE Text Expressible Selector');
  sel.property('ADBE Text Range Type2').setValue(3);   // baseado em palavras
  sel.property('ADBE Text Expressible Amount').expression =
    '// Tempos das palavras (s)\nvar T = [' + times.join(', ') + '];\n' +
    'var p = Math.min(Math.max((time - (T[textIndex - 1] - .04)) / .26, 0), 1);\n' +
    'p = 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2);\n' +
    'selectorValue * (1 - p);';
  if (acc.length) L.comment = 'Palavra em bloco roxo (#6f6fc9): ' + acc.join(', ');
  L.enabled = false;
  return L;
}

app.beginUndoGroup('04 CAZI S-EFX — montar comp');
if (!app.project) app.newProject();
var isNew = app.project.file === null && app.project.numItems === 0;
var root = app.project.items.addFolder('04 CAZI S-EFX');
var folder = app.project.items.addFolder('Arquivos'); folder.parentFolder = root;
var comp = app.project.items.addComp('04 CAZI S-EFX 9x16', W, H, 1, DUR, FPS);
comp.parentFolder = root; comp.bgColor = [0, 0, 0];

// de baixo para cima: cada camada nova entra no topo
var aud = [['mix_final.wav', 'Áudio — mix final (voz + SFX)', true], ['sfx_bus.wav', 'Áudio — SFX sozinhos', false]];
for (var i = 0; i < aud.length; i++) {
  var A = comp.layers.add(importOne(ROOT + '/audio/' + aud[i][0], folder));
  A.name = aud[i][1]; A.audioEnabled = aud[i][2];
}
var seqs = [['base', '00000.jpg', 'Vídeo base (punch-ins + escuro)', false], ['ovl', '00000.png', 'Sombras + relatório/painel/páginas (M26–M28)', true],
            ['kw', '00000.png', 'Títulos (render HTML)', true], ['ui', '00000.png', 'Interface: busca, celular, lista, editor, PRO, oferta', true]];
for (var j = 0; j < seqs.length; j++) {
  var L = comp.layers.add(importSeq(ROOT + '/' + seqs[j][0] + '/' + seqs[j][1], folder, seqs[j][3]));
  L.name = seqs[j][2];
}
for (var k = 0; k < DATA.kw.length; k++)
  for (var n = 0; n < DATA.kw[k].lines.length; n++) buildLine(comp, DATA.kw[k], DATA.kw[k].lines[n], k);

for (var m = 0; m < DATA.marks.length; m++)
  comp.markerProperty.setValueAtTime(DATA.marks[m].t, new MarkerValue(DATA.marks[m].name));

app.endUndoGroup();
comp.openInViewer();
if (isNew) app.project.save(new File(ROOT + '/04 CAZI S-EFX.aep'));
})();
