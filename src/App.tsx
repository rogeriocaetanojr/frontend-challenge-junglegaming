import { Filter, MoreVertical, Search, Sparkles, Wallet } from "lucide-react";

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

function App() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="bg-surface-card border border-border rounded-card p-8 max-w-lg w-full shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Badge variant="default" className="gap-1">
            <Sparkles className="size-3" />
            <span>Design System</span>
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
            Componentes compostos com Radix UI, Tailwind v4 e Design Tokens
          </p>
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

        {/* Skeleton Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Prévia de Carregamento (Skeleton)</span>
            <span className="font-mono text-primary">0.45 ETH</span>
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
                  <span className="text-sm font-medium">MetaMask (Simulada)</span>
                  <Badge variant="default">Ativa</Badge>
                </div>
                <div className="p-3 bg-surface-dark border border-border rounded-button flex items-center justify-between opacity-60">
                  <span className="text-sm font-medium">Coinbase Wallet</span>
                  <Badge variant="secondary">Em breve</Badge>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button variant="default">Confirmar Conexão</Button>
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
