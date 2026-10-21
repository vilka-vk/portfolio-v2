import { cpSync } from 'node:fs';

// Keep original asset URLs in the production output, including existing case links.
for (const asset of ['img', 'cases/img', 'Senior_Product_Designer_Violetta_Morozova_Eng.pdf']) {
  cpSync(new URL(`../${asset}`, import.meta.url), new URL(`../dist/${asset}`, import.meta.url), { recursive: true });
}
