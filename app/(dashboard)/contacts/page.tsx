import { DataTable } from "./data-table";
import { columns } from "./columns";

export default async function Buyer() {
  return (
    <div className="">
      <DataTable columns={columns} />
    </div>
  );
}
