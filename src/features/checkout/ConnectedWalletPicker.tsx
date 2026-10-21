import type { Wallet } from "@/contracts/identity";

const NETWORK_LABELS: Record<string, string> = {
  ethereum: "Rede principal Ethereum",
  polygon: "Rede Polygon",
  arbitrum: "Rede Arbitrum One",
  solana: "Rede Solana",
};

function shortAddress(address: string): string {
  return address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

interface ConnectedWalletPickerProps {
  wallets: Wallet[];
  selectedAddress: string;
  onSelect: (wallet: Wallet) => void;
}

/** Cartões de rádio das carteiras cadastradas (frame mobile "Pagamento com carteira"). */
export function ConnectedWalletPicker({
  wallets,
  selectedAddress,
  onSelect,
}: ConnectedWalletPickerProps) {
  if (wallets.length === 0) return null;

  return (
    <fieldset className="md:hidden space-y-3 font-mono">
      <legend className="w-full flex items-center justify-between mb-3 text-sm font-bold text-[#F5F1EB]">
        Carteira conectada
      </legend>
      {wallets.map((wallet) => {
        const isSelected = wallet.address === selectedAddress;
        return (
          <label
            key={wallet.id}
            className={`relative flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition-colors ${
              isSelected
                ? "bg-[#241612] border-[#D28A4C]"
                : "bg-[#1E1410] border-transparent hover:border-[#3F2319]"
            }`}
          >
            <input
              type="radio"
              name="connected-wallet"
              checked={isSelected}
              onChange={() => onSelect(wallet)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`mt-1 size-4 shrink-0 rounded-full border flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-[#D28A4C] ${
                isSelected ? "border-[#D28A4C]" : "border-[#8C6D58]"
              }`}
            >
              {isSelected && <span className="size-2 rounded-full bg-[#D28A4C]" />}
            </span>
            <span className="min-w-0 space-y-1">
              <span className="block text-sm font-bold text-[#F5F1EB]">
                {wallet.label || (wallet.role === "primary" ? "Principal" : "Reserva")}
              </span>
              <span className="block text-xs text-[#CFB28C] truncate">
                {shortAddress(wallet.address)}
              </span>
              <span className="block text-xs text-[#CFB28C]">
                {NETWORK_LABELS[wallet.network] ?? wallet.network}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
