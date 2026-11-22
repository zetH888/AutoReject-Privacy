import {cp,mkdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
await rm(resolve(root,'dist'),{recursive:true,force:true});
await mkdir(resolve(root,'dist'),{recursive:true});
for(const part of ['manifest.json','background','content','ui']) await cp(resolve(root,part),resolve(root,'dist',part),{recursive:true});
console.log('Built Engine/dist (load as an unpacked extension).');
