import { useRouter } from "next/router";
import { useEffect } from "react";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/LoadingPage";

export default function BasePage() {
  const router = useRouter();
  const baseId = router.query.baseId as string;

  const { data: table, isLoading } = api.base.getFirstTableBaseById.useQuery({ id: baseId });

  useEffect(() => {
    if (table) {
      void router.replace(`/${baseId}/${table.id}`);
    }
  }, [table, baseId, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen">
        <LoadingPage />
      </div>
    );
  } 

  return null; 
}
