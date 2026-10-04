import { landingContent, type ProductStatus } from "@/content/landing";

const CLASS_BY_STATUS: Record<ProductStatus, string> = {
  piloto: "selo--piloto",
  desenvolvimento: "selo--desenvolvimento",
  emUso: "selo--em-uso",
  emBreve: "selo--em-breve",
};

/** Selo de status do produto (MASTER §8.14): o texto carrega a informação; a cor só reforça. */
export function SeloStatus({ status }: { status: ProductStatus }) {
  return <span className={`selo ${CLASS_BY_STATUS[status]}`}>{landingContent.statusLabels[status]}</span>;
}
