/**
 * Simulador de condições de corrida (Race Conditions) e requisições fora de ordem.
 *
 * Permite orquestrar latências arbitrárias e ordenação invertida de respostas assíncronas
 * para validar resiliência e controle de concorrência no cliente e nos manipuladores.
 */

export interface InFlightRequest {
  id: string;
  key: string;
  startedAt: number;
  expectedDelayMs: number;
}

export interface RaceScheduleConfig {
  slowKey: string;
  slowDelayMs: number;
  fastKey: string;
  fastDelayMs: number;
}

export class RaceSimulator {
  private customDelays = new Map<string, number>();
  private inFlight = new Map<string, InFlightRequest>();
  private resolutionHistory: string[] = [];
  private heldGates = new Map<string, Array<() => void>>();

  /**
   * Configura um atraso específico para uma chave identificadora.
   */
  public setDelay(key: string, delayMs: number): void {
    this.customDelays.set(key, Math.max(0, delayMs));
  }

  /**
   * Retorna o atraso configurado para uma chave, ou o atraso base se não houver customização.
   */
  public getDelay(key: string, baseDelayMs: number = 0): number {
    return this.customDelays.get(key) ?? Math.max(0, baseDelayMs);
  }

  /**
   * Remove o atraso customizado de uma chave.
   */
  public removeDelay(key: string): void {
    this.customDelays.delete(key);
  }

  /**
   * Agenda um cenário de corrida onde uma chave rápida resolve antes de uma chave lenta.
   */
  public scheduleRace(config: RaceScheduleConfig): void {
    this.setDelay(config.slowKey, config.slowDelayMs);
    this.setDelay(config.fastKey, config.fastDelayMs);
  }

  /**
   * Pausa a execução com o atraso determinado para simulação de corrida.
   *
   * Se a chave estiver com retenção manual ativada via `hold(key)`, a Promise
   * só resolverá quando `release(key)` ou `releaseAll()` for acionado.
   */
  public async delayForRace(key: string, baseDelayMs: number = 0): Promise<void> {
    const delayMs = this.getDelay(key, baseDelayMs);
    const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    this.inFlight.set(reqId, {
      id: reqId,
      key,
      startedAt: Date.now(),
      expectedDelayMs: delayMs,
    });

    try {
      // 1. Se estiver retido manualmente
      if (this.heldGates.has(key)) {
        await new Promise<void>((resolve) => {
          const list = this.heldGates.get(key) ?? [];
          list.push(resolve);
          this.heldGates.set(key, list);
        });
      } else if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    } finally {
      this.inFlight.delete(reqId);
      this.resolutionHistory.push(key);
    }
  }

  /**
   * Ativa a retenção manual para uma chave. Novas chamadas a `delayForRace(key)`
   * ficarão suspensas até que `release(key)` seja chamado.
   */
  public hold(key: string): void {
    if (!this.heldGates.has(key)) {
      this.heldGates.set(key, []);
    }
  }

  /**
   * Libera todas as requisições retidas na chave especificada.
   */
  public release(key: string): void {
    const list = this.heldGates.get(key);
    if (list) {
      this.heldGates.delete(key);
      for (const resolve of list) {
        resolve();
      }
    }
  }

  /**
   * Libera todas as requisições retidas em todas as chaves.
   */
  public releaseAll(): void {
    for (const key of Array.from(this.heldGates.keys())) {
      this.release(key);
    }
  }

  /**
   * Retorna o histórico de resoluções na ordem exata em que foram finalizadas.
   */
  public getResolutionHistory(): string[] {
    return [...this.resolutionHistory];
  }

  /**
   * Retorna a quantidade de requisições atualmente em trânsito.
   */
  public get inFlightCount(): number {
    return this.inFlight.size;
  }

  /**
   * Limpa todo o estado do simulador (atrasos, histórico, gates e pendências).
   */
  public reset(): void {
    this.releaseAll();
    this.customDelays.clear();
    this.inFlight.clear();
    this.resolutionHistory = [];
    this.heldGates.clear();
  }
}

/** Instância singleton do simulador de concorrência e corridas. */
export const raceSimulator = new RaceSimulator();
