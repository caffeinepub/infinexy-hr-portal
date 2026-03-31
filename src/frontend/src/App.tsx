import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import AdminPage from "./pages/AdminPage";
import FormPage from "./pages/FormPage";
import Landing from "./pages/Landing";

type Page = "/" | "/form" | "/admin";

function getPage(): Page {
  const path = window.location.pathname;
  if (path.startsWith("/form")) return "/form";
  if (path.startsWith("/admin")) return "/admin";
  return "/";
}

export function navigate(page: Page) {
  window.history.pushState({}, "", page);
  window.dispatchEvent(new Event("routechange"));
}

export default function App() {
  const [page, setPage] = useState<Page>(getPage);

  useEffect(() => {
    const handler = () => setPage(getPage());
    window.addEventListener("popstate", handler);
    window.addEventListener("routechange", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("routechange", handler);
    };
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      {page === "/" && <Landing />}
      {page === "/form" && <FormPage />}
      {page === "/admin" && <AdminPage />}
    </>
  );
}
