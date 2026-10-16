var f = new File((new File($.fileName)).parent.fsName + '/run.log'); f.open('w');
try {
  var p = app.project, found = null, names = [];
  for (var i = 1; i <= p.numItems; i++) { var it = p.item(i); if (it.parentFolder === p.rootFolder) names.push(it.name + ' [' + it.typeName + '] id' + it.id); }
  for (var i = p.numItems; i >= 1; i--) { var it = p.item(i); if (it instanceof FolderItem && it.name === '04 CAZI S-EFX' && it.parentFolder === p.rootFolder && (!found || it.id > found.id)) found = it; }
  f.writeln('raiz: ' + names.join(' | '));
  if (found) {
    var ok = false;
    for (var j = 1; j <= found.numItems; j++) if (found.item(j).name === '04 CAZI S-EFX 9x16') ok = true;
    f.writeln('pasta id' + found.id + ' tem minha comp: ' + ok);
    if (ok) { found.remove(); f.writeln('removida'); }
  }
  f.writeln('itens agora: ' + p.numItems + ' dirty: ' + p.dirty);
} catch (e) { f.writeln('erro: ' + e); }
f.close();
