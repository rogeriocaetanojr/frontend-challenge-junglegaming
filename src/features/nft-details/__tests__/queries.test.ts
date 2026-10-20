/**
 * Testes unitários para as queries de detalhes do NFT (src/features/nft-details/queries.ts).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";
import { nftDetailQueryOptions } from "../queries";
import type { NftDetail } from "../types";

describe("nftDetailQueryOptions (src/features/nft-details/queries.ts)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve gerar a queryKey correta padronizada para o catálogo público", () => {
    const options = nftDetailQueryOptions("nft_123");
    expect(options.queryKey).toEqual(queryKeys.catalog.detail("nft_123"));
    expect(options.queryKey).toEqual(["public", "catalog", "detail", "nft_123"]);
  });

  it("deve disparar requisição GET para /api/nfts/:id e retornar os dados do NFT", async () => {
    const mockNftDetail: Partial<NftDetail> = {
      id: "nft_123" as never,
      title: "Cyber Ape #123",
      price: "2.5" as never,
      description: "Um NFT cibernético raro",
      creator: { id: "user_1", name: "CryptoArtist" },
    };

    const getSpy = vi.spyOn(http, "get").mockResolvedValueOnce(mockNftDetail);

    const options = nftDetailQueryOptions("nft_123");
    expect(options.queryFn).toBeDefined();

    const result = await (options.queryFn as () => Promise<NftDetail>)();

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledWith("/api/nfts/nft_123");
    expect(result).toEqual(mockNftDetail);
  });

  it("deve rejeitar se o ID for vazio ou inválido", async () => {
    const options = nftDetailQueryOptions("");
    await expect((options.queryFn as () => Promise<NftDetail>)()).rejects.toThrow(
      "ID de NFT inválido para consulta de detalhes.",
    );
  });
});
