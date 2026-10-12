import { requireSubscription } from "@/lib/guards";
import { NewDocumentClient } from "@/components/dashboard/NewDocumentClient";

export default async function NewDocumentPage() {
  await requireSubscription();
  return <NewDocumentClient />;
}
