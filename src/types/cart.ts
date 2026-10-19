/**
 * Representa um item adicionado ao carrinho de compras no marketplace de NFTs.
 * Como NFTs são tokens não-fungíveis únicos (1 de 1), a quantidade é restrita a 1.
 */
export interface CartItem {
  id: string;
  name: string;
  collection: string;
  priceEth: string | number;
  image: string;
  creator: string;
  quantity: 1;
}
