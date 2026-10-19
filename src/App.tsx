import * as React from "react";
import {
  Activity,
  CheckCircle2,
  Filter,
  MoreVertical,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateTotalEth,
  formatEth,
  formatUsd,
  truncateAddress,
} from "@/lib/formatters";
import { http } from "@/lib/http";

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

function App() {
  const sampleWallet = "0x71C8364437a9C27779976872A42F340a6B233921";
  const cartItems = [{ price: 0.1 }, { price: 0.2 }];
  const totalEthValue = calculateTotalEth(cartItems);
  const ethFormatted = formatEth(totalEthValue);
  const usdFormatted = formatUsd(Number(totalEthValue) * 3200);

  const [healthData, setHealthData] = React.useState<HealthResponse | null>(null);

  React.useEffect(() => {
    http
      .get<HealthResponse>("/health")
      .then((data) => setHealthData(data))
      .catch((err) => console.error("Falha ao consultar health check:", err));
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="bg-surface-card border border-border rounded-card p-8 max-w-lg w-full shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Badge variant="default" className="gap-1">
            <Sparkles className="size-3" />
            <span>Web3 Precision</span>
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Opções">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Menor Preço (ETH)</DropdownMenuItem>
              <DropdownMenuItem>Maior Preço (ETH)</DropdownMenuItem>
              <DropdownMenuItem>Mais Recentes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            NFT Marketplace
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Carteira:{" "}
            <span className="font-mono text-foreground font-medium">
              {truncateAddress(sampleWallet)}
            </span>
          </p>
        </div>

        {/* Status da Camada de Mocks (MSW) */}
        <div className="p-3 bg-surface-dark border border-border rounded-button flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary animate-pulse" />
            <span className="text-xs font-medium text-foreground">
              {healthData
                ? `${healthData.service} (${healthData.status.toUpperCase()})`
                : "Interceptando via MSW..."}
            </span>
          </div>
          <Badge variant={healthData ? "default" : "secondary"}>
            {healthData ? "Online (MSW)" : "Conectando"}
          </Badge>
        </div>

        {/* Input & Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <Input
            type="text"
            placeholder="Buscar coleções ou tokens..."
            className="pl-9"
            aria-label="Buscar coleções ou tokens"
          />
        </div>

        <Separator />

        {/* Validação de Precisão Decimal (IEEE 754 vs BigNumber) */}
        <div className="p-4 bg-surface-dark border border-border rounded-button space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
            <span>Precisão Aritmética (0.1 + 0.2)</span>
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="size-3" />
              <span>Imune a IEEE 754</span>
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-text-muted">Total Calculado:</span>
            <div className="text-right">
              <span className="font-mono text-base font-bold text-primary">
                {ethFormatted}
              </span>
              <span className="block text-xs text-text-muted">aprox. {usdFormatted}</span>
            </div>
          </div>
        </div>

        {/* Skeleton Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Carregamento Otimista</span>
            <span className="font-mono text-primary">0.05 ETH</span>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-card shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions & Dialog */}
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" className="flex-1">
                <Wallet className="size-4" />
                <span>Conectar Carteira</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conectar Carteira Web3</DialogTitle>
                <DialogDescription>
                  Selecione sua carteira simulada para autorizar transações no
                  marketplace.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-3">
                <div className="p-3 bg-surface-dark border border-border rounded-button flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">MetaMask (Simulada)</span>
                    <span className="block text-xs font-mono text-text-muted">
                      {truncateAddress(sampleWallet, 8, 6)}
                    </span>
                  </div>
                  <Badge variant="default">Conectado</Badge>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Fechar</Button>
                </DialogClose>
                <Button variant="default">Ver Histórico</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="icon" aria-label="Filtrar">
            <Filter className="size-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}

export default App;
