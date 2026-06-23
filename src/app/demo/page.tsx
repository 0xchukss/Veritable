import { redirect } from "next/navigation";

export default function DemoPage() {
  redirect("/app?demo=1");
}
