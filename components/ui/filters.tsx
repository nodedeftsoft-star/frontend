import { Separator } from "./separator";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./sheet";
import { ListFilter, X } from "lucide-react";
import { Checkbox } from "./checkbox";

interface FiltersProps {
  title: string;
  filters: {
    label: string;
    value: string;
  }[];
  onFilterChange?: (filter: string, checked: boolean) => void;
  value: string[];
}

export default function Filters({ title, filters, onFilterChange, value }: FiltersProps) {
  return (
    <Sheet>
      <SheetTrigger className="p-2">
        <ListFilter color={"#57738E"} size={18} />
      </SheetTrigger>
      <SheetContent hideCloseButton className="w-[256px] sm:w-[256px] rounded-t-lg rounded-b-lg p-8">
        <div className="flex justify-between">
          <p className="font-bold text-light-text text-lg">Filters</p>
          <SheetClose>
            <X size={22} strokeWidth={1.9} color="#57738E" />
          </SheetClose>
        </div>

        <Separator className="my-2" />

        <div>
          <p className="font-normal text-light-text text-base">{title}</p>
          <div className="flex flex-col gap-4 mt-4">
            {filters.map((filter, index) => (
              <div key={index} className="flex gap-4 items-center">
                <Checkbox
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange?.(filter.value, true);
                    } else {
                      onFilterChange?.(filter.value, false);
                    }
                  }}
                  checked={value.includes(filter.value.toLowerCase()) || value.includes(filter.value)}
                  className="data-[state=checked]:bg-white data-[state=checked]:text-[#07192C] data-[state=checked]:border-[#07192C] data-[state=checked]:border-2 w-[17px] h-[17px]"
                />
                <p className="text-base text-light-text">{filter.label}</p>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
