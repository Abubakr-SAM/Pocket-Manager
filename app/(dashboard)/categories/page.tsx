import CategoryManager from "@/components/CategoryManager";
import type { Category } from "@/components/TransactionForm";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const tr = await getT();

  const [categoriesRes, transactionsRes] = await Promise.all([
    supabase.from("categories").select("id, name, type").order("name"),
    supabase.from("transactions").select("category_id"),
  ]);

  if (categoriesRes.error) {
    console.error("Categories error:", categoriesRes.error.message);
  }
  if (transactionsRes.error) {
    console.error("Transactions error:", transactionsRes.error.message);
  }

  const categories = (categoriesRes.data ?? []) as Category[];

  const usage: Record<string, number> = {};
  for (const t of transactionsRes.data ?? []) {
    if (t.category_id) {
      usage[t.category_id] = (usage[t.category_id] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{tr("categories.title")}</h1>
        <p className="text-muted">
          {tr("categories.subtitle")}
        </p>
      </header>

      <CategoryManager categories={categories} usage={usage} />
    </div>
  );
}