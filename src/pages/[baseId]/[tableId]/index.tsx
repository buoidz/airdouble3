import Head from "next/head";
import { useRouter } from "next/router";
import { BaseSideBar } from "~/components/base/BaseSideBar";
import { BaseTopBar } from "~/components/base/BaseTopBar";
import { LoadingPage } from "~/components/LoadingPage";
import { TableMain } from "~/components/table/TableMain";
import { api } from "~/utils/api";

export default function TablePage() {
  const baseId = useRouter().query.baseId as string;
  const {data: base, isLoading: baseLoading} = api.base.getBaseById.useQuery({ id: baseId });
  const {data: tables, isLoading: tableLoading} = api.base.getAllTablesBaseById.useQuery({ id: baseId });

  if (baseLoading || tableLoading) {
    return (
      <>
        <Head>
          <title>Airtable</title>
          <link rel="icon" href="/airtable.png" />
        </Head>
        <main className="antialiased min-h-screen flex flex-row">
          <BaseSideBar />
          <div className="w-full">
            <LoadingPage />
          </div>
        </main>
      </>

    );
  };
  if (!base) return <div>Base not found</div>;
  if (!tables || tables.length === 0) return <div>No tables found.</div>;

  return (
      <>
      <Head>
        <title>{base.name}</title>
        <link rel="icon" href="/airtable.png" />
      </Head>
      <main className="antialiased h-screen flex flex-row pl-14">
        <BaseSideBar />
        <div className="flex flex-col w-full">
          <BaseTopBar baseName={base.name} baseId={baseId} />
          <TableMain baseId={baseId} />
        </div>
      </main>
    </>

  );
}