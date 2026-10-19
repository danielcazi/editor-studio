/* BeatGrid · tempos de filme ancorados em batida, compasso e quadro. Funções puras: o mesmo t dá o mesmo resultado (contrato do seek(t)).
   No filme:   <script src="../../lib/beatgrid.js"></script>   const g = BeatGrid.from(window.BEATS)   (BEATS = conteúdo do beats.json)
   No Node:    const BeatGrid = require('./beatgrid.js')
   Posição ("at") aceita: número (segundos) | { beat: n } | { bar: n, beat: b } | { drop: +compassos } | { t: s, snap: 'beat'|'bar'|'half'|'frame' } */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.BeatGrid = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function Grid(o) {
    this.bpm = o.bpm; this.beatSec = o.beatSec; this.beatsPerBar = o.beatsPerBar || 4;
    this.barSec = o.barSec || this.beatSec * this.beatsPerBar;
    this.downbeatSec = o.downbeatSec || 0;                 // tempo da batida 0 (primeiro tempo 1 de compasso)
    this.dropBar = o.dropBar || 0; this.durationSec = o.durationSec || 0;
  }
  var P = Grid.prototype;
  P.beat = function (n) { return this.downbeatSec + n * this.beatSec; };                      // batida n (0 = downbeat; n pode ser negativo)
  P.bar = function (n, b) { return this.downbeatSec + n * this.barSec + (b || 0) * this.beatSec; };
  P.drop = function (bars) { return this.bar(this.dropBar + (bars || 0)); };
  P.index = function (t) { return (t - this.downbeatSec) / this.beatSec; };                   // batida fracionária
  P.phase = function (t) { var x = this.index(t); return x - Math.floor(x); };                // 0..1 dentro da batida
  P.barPhase = function (t) { var x = (t - this.downbeatSec) / this.barSec; return x - Math.floor(x); };
  P.pulse = function (t, decay) { return Math.exp(-this.phase(t) * this.beatSec / (decay || 0.12)); }; // 1 na batida, cai depois
  P.nearest = function (t, unit) {
    var step = unit === 'bar' ? this.barSec : unit === 'half' ? this.beatSec / 2 : this.beatSec;
    var k = Math.round((t - this.downbeatSec) / step), time = this.downbeatSec + k * step;
    return { n: k, time: time, dist: t - time };
  };
  P.onBeat = function (t, tol, unit) { return Math.abs(this.nearest(t, unit).dist) <= (tol == null ? 1 / 60 : tol); };
  P.snap = function (t, unit, fps) {
    var s = unit === 'frame' ? t : this.nearest(t, unit).time;
    return fps ? Math.round(s * fps) / fps : s;                                                // com fps, cai no quadro mais próximo
  };
  P.resolve = function (at, fps) {
    if (typeof at === 'number') return at;
    var t;
    if (at.beat != null && at.bar == null) t = this.beat(at.beat);
    else if (at.bar != null) t = this.bar(at.bar, at.beat);
    else if (at.drop != null) t = this.drop(at.drop);
    else if (at.t != null) return this.snap(at.t, at.snap || 'beat', fps);
    else throw new Error('posição inválida: ' + JSON.stringify(at));
    return fps ? Math.round(t * fps) / fps : t;
  };
  return {
    Grid: Grid,
    from: function (j) { return new Grid(j); },                                                // j = beats.json do build-beats
    fromBpm: function (bpm, offset, beatsPerBar) { return new Grid({ bpm: bpm, beatSec: 60 / bpm, downbeatSec: offset || 0, beatsPerBar: beatsPerBar }); }, // beats.json antigo: { bpm, beats[] }
    fromLegacy: function (j) { return new Grid({ bpm: j.bpm, beatSec: 60 / j.bpm, downbeatSec: (j.beats && j.beats[0]) || 0 }); }
  };
});
