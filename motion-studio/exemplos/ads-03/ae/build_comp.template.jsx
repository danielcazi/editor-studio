// Ads 03 · connect rate (job ads-03-mvab2akf) — monta a comp 9x16 no After Effects. Gerado por make_jsx.mjs.
// Camadas: sequências exportadas do filme HTML (base, fundo da marca, pessoa recortada, peças gráficas)
// + os títulos de cada cena como TEXTO NATIVO (Inter), desligados; a versão ligada é o PNG idêntico ao storyboard.
(function () {
/*__DATA__*/
var ROOT = (new File($.fileName)).parent.fsName;
var FPS = DATA.fps, DUR = DATA.dur, W = 1080, H = 1920;
var LOG = new File(ROOT + '/build_comp.log'); LOG.open('w'); LOG.writeln('start'); LOG.close();
function log(s) { LOG.open('a'); LOG.writeln(s); LOG.close(); }
function importSeq(path, folder, alpha) {
  var io = new ImportOptions(new File(path)); io.sequence = true; io.forceAlphabetical = true;
  var it = app.project.importFile(io); it.mainSource.conformFrameRate = FPS;
  if (alpha) it.mainSource.alphaMode = AlphaMode.STRAIGHT;
  it.parentFolder = folder; return it;
}
function importOne(path, folder) { var it = app.project.importFile(new ImportOptions(new File(path))); it.parentFolder = folder; return it; }
function rgb(c) { var m = c.match(/[\d.]+/g); return [m[0] / 255, m[1] / 255, m[2] / 255]; }
function title(comp, T, n) {
  var txt = T.text.replace(/\n/g, '\r');
  var L = comp.layers.addText(txt);
  L.name = 'Título ' + n + ' · ' + T.scene + ' — ' + T.text.replace(/\n/g, ' ');
  var st = L.property('ADBE Text Properties').property('ADBE Text Document'), td = st.value;
  td.resetCharStyle(); td.resetParagraphStyle();
  td.font = 'Inter-ExtraBold'; td.fontSize = T.size; td.applyFill = true; td.fillColor = rgb(T.color); td.applyStroke = false;
  td.tracking = -40; td.leading = T.lh;
  td.justification = T.align === 'center' ? ParagraphJustification.CENTER_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY;
  st.setValue(td);
  L.inPoint = T.a; L.outPoint = T.b;
  var tr = L.property('ADBE Transform Group');
  tr.property('ADBE Anchor Point').setValue([0, 0]);
  tr.property('ADBE Position').setValue([T.align === 'center' ? T.x + T.w / 2 : T.x, T.y + 0.8 * T.size]);
  var op = tr.property('ADBE Opacity'); op.setValueAtTime(T.a, 0); op.setValueAtTime(T.a + 0.2, 100);
  L.enabled = false;
}
app.beginUndoGroup('Ads 03 — montar comp');
if (!app.project) app.newProject();
var root = app.project.items.addFolder('Ads 03 · connect rate');
var folder = app.project.items.addFolder('Arquivos'); folder.parentFolder = root;
var comp = app.project.items.addComp('Ads 03 connect rate 9x16', W, H, 1, DUR, FPS);
comp.parentFolder = root; comp.bgColor = [0, 0, 0];
var aud = [['mix_final.wav', 'Áudio — mix final (voz + SFX, -14 LUFS)', true], ['voz.wav', 'Áudio — voz original', false], ['sfx.wav', 'Áudio — SFX sintetizados', false]];
for (var i = 0; i < aud.length; i++) { var A = comp.layers.add(importOne(ROOT + '/audio/' + aud[i][0], folder)); A.name = aud[i][1]; A.audioEnabled = aud[i][2]; }
log('audio ok');
var seqs = [['base', 'Vídeo base', false, 'jpg'], ['bg', 'Fundo da marca (creme / roxo)', true, 'png'],
            ['person', 'Pessoa (recorte BiRefNet)', true, 'png'], ['gfx', 'Peças gráficas + cortina roxa (render HTML, igual ao storyboard)', true, 'png']];
for (var j = 0; j < seqs.length; j++) { var Ls = comp.layers.add(importSeq(ROOT + '/V/' + seqs[j][0] + '/00000.' + seqs[j][3], folder, seqs[j][2])); Ls.name = seqs[j][1]; }
log('seqs ok');
for (var k = 0; k < DATA.titles.length; k++) title(comp, DATA.titles[k], k + 1);
log('titles ok');
for (var m = 0; m < DATA.markers.length; m++) comp.markerProperty.setValueAtTime(DATA.markers[m].t, new MarkerValue(DATA.markers[m].label));
app.endUndoGroup();
app.project.save(new File(DATA.aep));
log('saved ' + DATA.aep);
})();
