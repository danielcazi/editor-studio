var f = new File((new File($.fileName)).parent.fsName + '/run.log'); f.open('w');
try { $.evalFile((new File($.fileName)).parent.fsName + '/build_comp.jsx'); f.writeln('ok ' + (app.project.file ? app.project.file.fsName : 'NAO SALVO (projeto já aberto)')); }
catch (e) { f.writeln('erro: ' + e.toString() + ' linha ' + e.line); }
f.close();
