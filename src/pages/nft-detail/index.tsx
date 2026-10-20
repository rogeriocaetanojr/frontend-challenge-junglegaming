import { useParams } from "react-router-dom";
import { NftDetailPage as FeatureNftDetailPage } from "@/features/nft-details/NftDetailPage";

export function NftDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <FeatureNftDetailPage nftId={id} />;
}

export default NftDetailPage;
