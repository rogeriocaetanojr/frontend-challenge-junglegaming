import { Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function App() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="bg-surface-card border border-border rounded-card p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="default" className="gap-1">
            <Sparkles className="size-3" />
            <span>Figma Tokens</span>
          </Badge>
          <Badge variant="secondary">Live Mocks</Badge>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            NFT Marketplace
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Componentes atômicos com shadcn/ui e design system
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Buscar coleções ou NFTs..."
              className="pl-9"
              aria-label="Buscar coleções ou NFTs"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="default" className="flex-1">
              Explorar Coleção
            </Button>
            <Button variant="outline">Filtros</Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
