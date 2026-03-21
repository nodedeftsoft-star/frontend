import { DataTable } from "./data-table";
import { columns } from "./columns";

export default async function Buyer() {
  return (
    <div>
      <DataTable columns={columns} />
    </div>
  );
}
