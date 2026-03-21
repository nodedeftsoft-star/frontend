import { DataTable } from "./data-table";
import { columns } from "./columns";

export default async function ListingRentalsPage() {
  return (
    <div>
      <DataTable columns={columns} />
    </div>
  );
}
