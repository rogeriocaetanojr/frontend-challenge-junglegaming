/**
 * Executa as auditorias desktop e mobile e sempre gera o resumo consolidado.
 *
 * O `lhci autorun` sai com código 1 quando uma asserção reprova; encadear os passos
 * com `&&` interromperia o pipeline antes do resumo. Aqui os dois perfis rodam até o
 * fim, o resumo é gerado e o código de saída reflete se alguma meta reprovou.
 */
import { spawnSync } from "node:child_process";

const profiles = ["lighthouse:desktop", "lighthouse:mobile"];
const failed = [];

for (const script of profiles) {
  const { status } = spawnSync("pnpm", [script], { stdio: "inherit", shell: true });
  if (status !== 0) failed.push(script);
}

const summary = spawnSync("pnpm", ["lighthouse:summary"], {
  stdio: "inherit",
  shell: true,
});
if (summary.status !== 0) process.exit(summary.status ?? 1);

if (failed.length > 0) {
  console.error(
    `\nMetas reprovadas em: ${failed.join(", ")} (relatórios gerados mesmo assim).`,
  );
  process.exit(1);
}
