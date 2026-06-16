"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ListView } from "./views/ListView";
import { CreateWizard } from "./views/CreateWizard";
import { PlanDetail } from "./views/PlanDetail";
import { SettingsView } from "./views/SettingsView";
import { StatusMenu } from "./StatusMenu";
import {
  ItemModal,
  emptyItemModal,
  itemModalFromItem,
  type ItemModalState,
} from "./ItemModal";
import { PAL, type ThemeName } from "@/lib/theme";
import { useAppData } from "@/lib/useAppData";
import type { Status } from "@/lib/types";

type View = "list" | "create" | "plan" | "settings";

export default function App() {
  const data = useAppData();
  const [view, setView] = useState<View>("list");
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [statusMenu, setStatusMenu] = useState<{ rowId: string; pos: { top: number; right: number } } | null>(null);
  const [itemModal, setItemModal] = useState<ItemModalState | null>(null);

  // theme persistence + body sync
  const firstThemeWrite = useRef(true);
  useEffect(() => {
    const saved = window.localStorage.getItem("cp-theme") as ThemeName | null;
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);
  useEffect(() => {
    const pal = PAL[theme];
    document.body.style.background = pal["--canvas"];
    document.documentElement.style.colorScheme = theme;
    // Skip the very first write so the initial 'dark' default never clobbers
    // a saved 'light' before the load effect has read it.
    if (firstThemeWrite.current) {
      firstThemeWrite.current = false;
      return;
    }
    window.localStorage.setItem("cp-theme", theme);
  }, [theme]);

  // navigation
  const goList = () => {
    setStatusMenu(null);
    data.closePlan();
    setView("list");
    void data.refresh();
  };
  const goSettings = () => {
    setStatusMenu(null);
    data.closePlan();
    setView("settings");
    void data.refresh();
  };
  const startCreate = () => {
    setStatusMenu(null);
    setView("create");
  };
  const openPlan = async (id: string) => {
    setStatusMenu(null);
    await data.openPlan(id);
    setView("plan");
  };
  const cancelCreate = () => setView("list");

  // status menu
  const toggleStatusMenu = (rowId: string, e: React.MouseEvent) => {
    if (statusMenu?.rowId === rowId) {
      setStatusMenu(null);
      return;
    }
    let pos = { top: 120, right: 40 };
    try {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      pos = { top: rect.bottom + 5, right: Math.max(8, window.innerWidth - rect.right) };
    } catch {}
    setStatusMenu({ rowId, pos });
  };
  const selectStatus = (s: Status) => {
    if (statusMenu) void data.setRowStatus(statusMenu.rowId, s);
    setStatusMenu(null);
  };

  // item modal
  const openAddItem = () => setItemModal(emptyItemModal());
  const openEditItem = (id: string) => {
    const it = data.items.find((i) => i.id === id);
    if (it) setItemModal(itemModalFromItem(it));
  };
  const saveItem = async (input: Parameters<typeof data.createItem>[0]) => {
    if (itemModal?.mode === "edit" && itemModal.id) await data.updateItem(itemModal.id, input);
    else await data.createItem(input);
  };

  const shellStyle: CSSProperties = {
    ...(PAL[theme] as CSSProperties),
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    color: "var(--ink)",
    background: "var(--canvas)",
    fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
  };

  const showTopbar = view !== "create";
  const menuRow = statusMenu && data.currentPlan?.rows.find((r) => r.id === statusMenu.rowId);

  return (
    <div style={shellStyle}>
      <Sidebar
        view={view}
        theme={theme}
        planCount={data.plans.length}
        onCreate={startCreate}
        onList={goList}
        onSettings={goSettings}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          background: "var(--canvas)",
        }}
      >
        {showTopbar && (
          <Topbar
            view={view as "list" | "plan" | "settings"}
            planName={data.currentPlan?.name}
            onList={goList}
            onAddItem={openAddItem}
          />
        )}

        {view === "list" && <ListView plans={data.plans} onOpen={openPlan} onDelete={data.deletePlan} />}

        {view === "create" && (
          <CreateWizard
            items={data.items}
            onCancel={cancelCreate}
            onGenerate={async (input) => {
              await data.createPlan(input);
              setView("plan");
              void data.refresh();
            }}
          />
        )}

        {view === "plan" && data.currentPlan && (
          <PlanDetail
            key={data.currentPlan.id}
            plan={data.currentPlan}
            items={data.items}
            onToggleStatusMenu={toggleStatusMenu}
            onChangeCount={data.changeRowCount}
            onDeleteRow={data.deleteRow}
            onReorder={data.reorderRows}
            onCloseMenu={() => setStatusMenu(null)}
          />
        )}

        {view === "settings" && (
          <SettingsView items={data.items} onEdit={openEditItem} onDelete={data.deleteItem} />
        )}
      </main>

      {statusMenu && menuRow && (
        <StatusMenu
          pos={statusMenu.pos}
          current={menuRow.status}
          onSelect={selectStatus}
          onClose={() => setStatusMenu(null)}
        />
      )}

      {itemModal && (
        <ItemModal initial={itemModal} onSave={saveItem} onClose={() => setItemModal(null)} />
      )}
    </div>
  );
}
