import { useRouter } from "next/router";
import { api } from "~/utils/api";

export default function BasePage() {
  const router = useRouter(); 
  const { baseId } = router.query;

  const {data: base, isLoading, error} = api.base.getBaseById.useQuery({id: baseId as string});
  
  return (
    <div>
      Base Page
    </div>
  );
}