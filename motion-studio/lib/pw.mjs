// Acha o playwright onde ele estiver: node_modules do motion-studio, da pasta atual ou ~/.editor-studio/deps
// (criada por /editor-studio:setup quando o kit roda como plugin e a pasta do plugin é somente leitura).
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

const bases = [
  import.meta.url,
  join(process.cwd(), 'package.json'),
  join(process.env.EDITOR_STUDIO_DEPS || join(homedir(), '.editor-studio', 'deps'), 'package.json'),
];
let pw = null, ultimo = null;
for (const b of bases) { try { pw = createRequire(b)('playwright'); break; } catch (e) { ultimo = e; } }
if (!pw) {
  console.error('playwright não encontrado. Instale com:  bash install.sh   (projeto)  ou  /editor-studio:setup  (plugin).');
  throw ultimo;
}
export const chromium = pw.chromium;
