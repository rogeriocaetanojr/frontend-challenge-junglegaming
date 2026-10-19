function App() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="bg-surface-card border border-border rounded-card p-8 max-w-sm w-full text-center shadow-lg">
        <h1 className="text-2xl font-bold text-primary mb-2">NFT Marketplace</h1>
        <p className="text-sm text-text-muted mb-6">Design System & Tokens Figma</p>
        <button
          type="button"
          className="bg-primary hover:bg-primary-dark text-ink-deep font-semibold py-2.5 px-4 rounded-button w-full transition-colors"
        >
          Explorar Coleções
        </button>
      </div>
    </main>
  );
}

export default App;
