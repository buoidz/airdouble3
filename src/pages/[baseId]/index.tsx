import { useRouter } from "next/router";
import { useEffect } from "react";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/LoadingPage";

export default function BasePage() {
  const router = useRouter();
  const { baseId } = router.query;

  const { data: table, isLoading } = api.base.getFirstTableBaseById.useQuery({ id: baseId as string });

  useEffect(() => {
    if (table) {
      router.replace(`/${baseId}/${table.id}`);
    }
  }, [table, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen">
        <LoadingPage />
      </div>
    );
  } 

  return null; 
}
