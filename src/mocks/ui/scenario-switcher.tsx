/**
 * Drawer / Painel flutuante de depuração para alternância de cenários MSW e inspeção local.
 *
 * Permite selecionar cenários de rede, ajustar latência e taxa de erros em tempo de execução,
 * e reiniciar o banco de dados em memória diretamente pela interface visual.
 */
import * as React from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { resetDb } from "@/mocks/db";
import { SCENARIO_REGISTRY, scenarioEngine, type ScenarioName } from "@/mocks/scenarios";

export function ScenarioSwitcher() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [activeScenario, setActiveScenario] = React.useState(() =>
    scenarioEngine.getScenario(),
  );
  const [latencyMs, setLatencyMs] = React.useState<number>(
    () => activeScenario.latencyMs,
  );
  const [faultRate, setFaultRate] = React.useState<number>(
    () => activeScenario.faultRate,
  );
  const [statusMessage, setStatusMessage] = React.useState<string>("");

  const handleOpen = () => {
    const current = scenarioEngine.getScenario();
    setActiveScenario(current);
    setLatencyMs(current.latencyMs);
    setFaultRate(current.faultRate);
    setIsOpen(true);
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as ScenarioName;
    const updated = scenarioEngine.setScenario(selected);
    setActiveScenario(updated);
    setLatencyMs(updated.latencyMs);
    setFaultRate(updated.faultRate);
  };

  const handleLatencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    scenarioEngine.setLatency(value);
    setLatencyMs(value);
    setActiveScenario(scenarioEngine.getScenario());
  };

  const handleFaultRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    scenarioEngine.setFaultRate(value);
    setFaultRate(value);
    setActiveScenario(scenarioEngine.getScenario());
  };

  const handleReset = () => {
    resetDb();
    scenarioEngine.reset();
    const updated = scenarioEngine.getScenario();
    setActiveScenario(updated);
    setLatencyMs(updated.latencyMs);
    setFaultRate(updated.faultRate);
    setStatusMessage("Banco e cenários resetados com sucesso!");

    setTimeout(() => {
      setStatusMessage("");
    }, 3000);
  };

  const scenarioKeys = Object.keys(SCENARIO_REGISTRY) as ScenarioName[];

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {/* Botão de Disparo Flutuante (Launcher) */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          data-testid="scenario-switcher-toggle"
          aria-label="Abrir painel de depuração de cenários"
          className="flex items-center gap-2.5 rounded-full border border-zinc-700/80 bg-zinc-900/90 px-4 py-2.5 text-xs font-semibold text-zinc-100 shadow-xl backdrop-blur-md transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:shadow-2xl active:scale-95"
        >
          <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
          <span>Mocks DevTools</span>
          <span
            data-testid="scenario-badge"
            className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30"
          >
            {activeScenario.name}
          </span>
        </button>
      )}

      {/* Painel Flutuante / Drawer */}
      {isOpen && (
        <div
          data-testid="scenario-switcher-drawer"
          role="dialog"
          aria-label="Painel de Controle de Cenários MSW"
          className="w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-800 bg-zinc-950/95 p-5 text-zinc-100 shadow-2xl backdrop-blur-xl transition-all"
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
                Simulador de Rede & Cenários
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              data-testid="scenario-switcher-close"
              aria-label="Fechar painel"
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Seletor de Cenário */}
            <div>
              <label
                htmlFor="mock-scenario-select"
                className="block text-xs font-medium text-zinc-400 mb-1.5"
              >
                Cenário Ativo
              </label>
              <div className="relative">
                <select
                  id="mock-scenario-select"
                  data-testid="scenario-select"
                  value={activeScenario.name}
                  onChange={handleScenarioChange}
                  className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 outline-none transition-colors hover:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {scenarioKeys.map((key) => (
                    <option key={key} value={key} className="bg-zinc-900 text-zinc-200">
                      {key} — {SCENARIO_REGISTRY[key].name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-3.5 w-3.5 text-zinc-400" />
              </div>
              <p
                data-testid="scenario-description"
                className="mt-1.5 text-[11px] leading-relaxed text-zinc-400"
              >
                {activeScenario.description}
              </p>
            </div>

            {/* Slider de Latência */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-zinc-300">Latência Artificial</span>
                <span
                  data-testid="latency-display"
                  className="font-mono text-[11px] font-semibold text-emerald-400"
                >
                  {latencyMs} ms
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="50"
                value={latencyMs}
                onChange={handleLatencyChange}
                data-testid="latency-slider"
                aria-label="Ajuste de latência em milissegundos"
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>0ms (Instantâneo)</span>
                <span>1500ms</span>
                <span>3000ms (3G Lento)</span>
              </div>
            </div>

            {/* Slider de Taxa de Falhas */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-zinc-300">
                  Taxa de Falhas (Flakiness)
                </span>
                <span
                  data-testid="fault-rate-display"
                  className="font-mono text-[11px] font-semibold text-amber-400"
                >
                  {(faultRate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={faultRate}
                onChange={handleFaultRateChange}
                data-testid="fault-rate-slider"
                aria-label="Ajuste de taxa de falhas probabilística"
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>0% (Estável)</span>
                <span>50%</span>
                <span>100% (Indisponível)</span>
              </div>
            </div>

            {/* Aviso sobre Erros Forçados */}
            {activeScenario.forcedErrors &&
              Object.keys(activeScenario.forcedErrors).length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold">Erros Forçados Ativos:</span>
                    <ul className="mt-0.5 list-disc list-inside space-y-0.5 text-[10px] text-amber-300/80">
                      {Object.entries(activeScenario.forcedErrors).map(([path, err]) => (
                        <li key={path}>
                          {path} ➔ {err.status} ({err.code})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            {/* Feedback de Reset */}
            {statusMessage && (
              <div
                data-testid="status-message"
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs font-medium text-emerald-300 animate-in fade-in"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Botão de Reset Database */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleReset}
                data-testid="reset-db-button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white active:scale-98"
              >
                <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
                <span>Reset Database & Cenários</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScenarioSwitcher;
