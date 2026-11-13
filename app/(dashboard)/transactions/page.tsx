import TransactionForm, { type Category } from "@/components/TransactionForm";
import { getT } from "@/lib/i18n/server";
import TransactionList, {
  type TransactionRow,
} from "@/components/TransactionList";
import { createClient } from "@/lib/supabase/server";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const t = await getT();

  const [categoriesRes, transactionsRes] = await Promise.all([
    supabase.from("categories").select("id, name, type").order("name"),
    supabase
      .from("transactions")
      .select(
        "id, type, amount, category_id, description, date, categories(name), savings_goals(name)"
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (categoriesRes.error) {
    console.error("Categories error:", categoriesRes.error.message);
  }
  if (transactionsRes.error) {
    console.error("Transactions error:", transactionsRes.error.message);
  }

  const categories = (categoriesRes.data ?? []) as Category[];
  const transactions = (transactionsRes.data ??
    []) as unknown as TransactionRow[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("transactions.title")}</h1>
        <p className="text-muted">{t("transactions.subtitle")}</p>
      </header>

      <TransactionForm categories={categories} />

      <TransactionList transactions={transactions} categories={categories} />
    </div>
  );
}