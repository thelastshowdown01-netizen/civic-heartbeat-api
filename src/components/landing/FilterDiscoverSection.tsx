import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import { formatCategory, formatStatus } from "@/lib/issueHelpers";

const FilterDiscoverSection = () => {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Discover Issues Near You
          </h2>
          <p className="text-sm text-muted-foreground">
            Filter by location, category, status, or priority to find what matters most.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto items-end">
          <div className="flex-1 min-w-0">
            <Input placeholder="Enter pincode..." className="h-10" />
          </div>
          <Select>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {Constants.public.Enums.issue_category.map((cat) => (
                <SelectItem key={cat} value={cat}>{formatCategory(cat)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {Constants.public.Enums.issue_status.map((s) => (
                <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {Constants.public.Enums.priority_label.map((p) => (
                <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="gap-2 shrink-0">
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FilterDiscoverSection;
