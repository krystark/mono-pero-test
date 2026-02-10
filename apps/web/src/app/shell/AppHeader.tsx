// src/app/shell/AppHeader.tsx
import * as React from "react";
import { RightArrowIcon } from "@krystark/ui-kit-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";

type Tab = { id: string; title: string; url: string };
type NavItem = { id: string; title: string; url?: string; tabs?: Tab[] };

type Props = {
  menu?: NavItem[];
  breadcrumbs?: NavItem[];
  hideOnHome?: boolean;
  className?: string;
};

export default function AppHeader({ menu, breadcrumbs, hideOnHome = true, className = "" }: Props) {
  const items: NavItem[] = menu ?? breadcrumbs ?? [];
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const activeModule = React.useMemo(() => {
    const withUrl = items.filter(m => m.url);
    withUrl.sort((a, b) => b.url!.length - a.url!.length);
    return withUrl.find(m => pathname === m.url || pathname.startsWith(m.url! + "/"));
  }, [items, pathname]);

  const activeTab = React.useMemo(() => {
    if (!activeModule?.tabs?.length) return undefined;
    const tabs = [...activeModule.tabs].sort((a, b) => b.url.length - a.url.length);
    return tabs.find(t => pathname === t.url || pathname.startsWith(t.url + "/"));
  }, [activeModule, pathname]);

  const crumbs = React.useMemo(() => {
    const arr: Array<{ title: string; url?: string }> = [{ title: "Главная", url: "/" }];
    if (activeModule && activeModule.url !== "/")
      arr.push({ title: activeModule.title, url: activeModule.url });
    if (activeTab) arr.push({ title: activeTab.title, url: activeTab.url });
    return arr;
  }, [activeModule, activeTab]);

  const pageTitle = crumbs[crumbs.length - 1]?.title ?? "Портал";

  if (hideOnHome && pathname === "/") return null;

  return (
    <header className={["pt-[24px]", className].join(" ")}>
      <div className="flex items-center gap-3 text-secondary text-[13px] leading-[16px]">
        <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-[4px]">
          {crumbs.map((c, i) => (
            <React.Fragment key={`${c.title}-${i}`}>
              {i > 0 && <RightArrowIcon size="xs" />}
              {i < crumbs.length - 1 && c.url ? (
                <Link to={c.url} className="hover:text-accent text-body-m">
                  {c.title}
                </Link>
              ) : (
                <span className="text-primary">{c.title}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </header>
  );
}
