import { redirect } from "next/navigation";

export default function MarketPage() {
  redirect("/musicmap?filter=instrument");
}
