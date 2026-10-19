import * as React from "react";

export function NewsletterFeaturesSection() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <div
      className="p-6 sm:p-8 lg:p-10 text-left"
      aria-label="Diferenciais da Kurio e Newsletter"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 items-stretch">
        {/* Diferencial 1: W - Segurança da carteira */}
        <div className="min-w-0 space-y-3.5 lg:pr-8 lg:border-r lg:border-[#D28A4C]">
          <div className="size-14 sm:size-16 rounded-full bg-[#D28A4C] text-[#0E0907] flex items-center justify-center font-black font-mono text-xl sm:text-2xl shadow-md select-none">
            W
          </div>
          <h4 className="text-base sm:text-lg font-bold font-mono text-[#F5F1EB] tracking-tight leading-snug">
            Segurança da carteira
          </h4>
          <p className="text-xs sm:text-sm text-[#CFB28C]/80 leading-relaxed font-mono">
            Proteja sua carteira e colecione arte digital verificada com confiança.
          </p>
        </div>

        {/* Diferencial 2: C - Criadores em destaque */}
        <div className="min-w-0 space-y-3.5 lg:px-8 lg:border-r lg:border-[#D28A4C]">
          <div className="size-14 sm:size-16 rounded-full bg-[#D28A4C] text-[#0E0907] flex items-center justify-center font-black font-mono text-xl sm:text-2xl shadow-md select-none">
            C
          </div>
          <h4 className="text-base sm:text-lg font-bold font-mono text-[#F5F1EB] tracking-tight leading-snug">
            Criadores em destaque
          </h4>
          <p className="text-xs sm:text-sm text-[#CFB28C]/80 leading-relaxed font-mono">
            Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
          </p>
        </div>

        {/* Diferencial 3: D - Alertas de lançamentos */}
        <div className="min-w-0 space-y-3.5 lg:px-8 lg:border-r lg:border-[#D28A4C]">
          <div className="size-14 sm:size-16 rounded-full bg-[#D28A4C] text-[#0E0907] flex items-center justify-center font-black font-mono text-xl sm:text-2xl shadow-md select-none">
            D
          </div>
          <h4 className="text-base sm:text-lg font-bold font-mono text-[#F5F1EB] tracking-tight leading-snug">
            Alertas de lançamentos
          </h4>
          <p className="text-xs sm:text-sm text-[#CFB28C]/80 leading-relaxed font-mono">
            Receba calendários de cunhagem, novidades de listas de acesso e análises do
            mercado.
          </p>
        </div>

        {/* Formulário: Antecipe-se ao próximo lançamento */}
        <div className="min-w-0 space-y-3.5 lg:pl-8">
          <h4 className="text-base sm:text-lg font-bold font-mono text-[#F5F1EB] tracking-tight leading-snug">
            Antecipe-se ao próximo lançamento
          </h4>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 pt-1 w-full min-w-0"
          >
            <input
              type="email"
              required
              placeholder="digite seu e-mail..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-w-0 flex-1 bg-[#1A100C] border border-[#38220F] text-xs text-white placeholder:text-[#CFB28C]/60 rounded-lg px-3 py-2.5 font-mono focus:outline-none focus:border-[#D28A4C] transition-colors"
              aria-label="Endereço de e-mail para newsletter"
            />
            <button
              type="submit"
              className="bg-[#D28A4C] hover:bg-[#c47b3e] text-[#0E0907] font-bold font-mono text-xs px-3.5 sm:px-4 py-2.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Enviar
            </button>
          </form>

          {submitted ? (
            <p className="text-[11px] sm:text-xs text-emerald-400 font-mono font-medium animate-in fade-in">
              Obrigado! Você agora receberá nossos alertas prioritários.
            </p>
          ) : (
            <p className="text-[11px] sm:text-xs text-[#CFB28C]/70 font-mono leading-relaxed">
              Receba lançamentos selecionados, histórias de criadores e novidades do
              mercado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
