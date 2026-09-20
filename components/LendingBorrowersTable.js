"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Tag from "@/components/ui/Tag";
import LendingActionsMenu from "@/components/LendingActionsMenu";
import DownloadLendingPdf from "@/components/DownloadLendingPdf";
import LendingForm from "@/components/LendingForm";
import SendReminderButton from "@/components/SendReminderButton";
import { formatCurrencyPrecise, formatDateShort, daysSince, ordinal } from "@/lib/format";
import { getNextDueInfo } from "@/lib/lending";
import { setLendingStatus, deleteLending, sendReminder, updateLending, reorderLendings } from "@/lib/actions/lending";

function DueBadge({ l }) {
  const info = getNextDueInfo(l);
  if (!info) return <span className="text-xs text-muted">—</span>;
  const overdue = info.diffDays < 0;
  return (
    <div className="text-xs">
      <p className="font-medium text-foreground">{formatDateShort(info.due)}</p>
      <p className={overdue ? "font-semibold text-danger" : "text-muted"}>
        {overdue ? `Overdue ${Math.abs(info.diffDays)}d` : `${info.diffDays} days`}
      </p>
    </div>
  );
}

// Cards and the table can't both be mounted at once — dnd-kit's useSortable
// registers each item id once, so rendering both (even with one CSS-hidden)
// would register every id twice. Pick one representation in JS instead.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

function menuProps(l) {
  return {
    isClosed: l.status === "closed",
    statusAction: setLendingStatus.bind(null, l._id, l.status === "closed" ? "active" : "closed"),
    deleteAction: deleteLending.bind(null, l._id),
    editSlot: <LendingForm action={updateLending.bind(null, l._id)} defaults={l} variant="menu" />,
    reminderSlot: <SendReminderButton action={sendReminder.bind(null, l._id)} variant="menu" />,
  };
}

function SortableRow({ l }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: l._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="cursor-pointer transition-colors hover:bg-background" onClick={() => router.push(`/lending/${l._id}`)}>
      <td className="py-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag to reorder"
            className="flex h-6 w-6 shrink-0 touch-none items-center justify-center text-muted active:cursor-grabbing"
          >
            <GripVertical size={15} />
          </button>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
            {l.borrower.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{l.borrower}</p>
            <p className="truncate text-[11px] text-muted">
              Given {formatDateShort(l.dateGiven)} · {daysSince(l.dateGiven)}d ago
            </p>
          </div>
        </div>
      </td>
      <td className="py-3">
        <p className="text-sm font-semibold text-danger">{formatCurrencyPrecise(l.principal)}</p>
        <p className="text-[11px] text-success">Paid {formatCurrencyPrecise(l.principalRepaid)}</p>
      </td>
      <td className="py-3 text-sm font-semibold text-warning">{formatCurrencyPrecise(l.outstanding)}</td>
      <td className="py-3 text-sm font-semibold text-info">{formatCurrencyPrecise(l.interest)}</td>
      <td className="py-3 text-sm text-muted">
        {l.status === "closed" ? (
          "—"
        ) : (
          <>
            {formatCurrencyPrecise(l.monthlyInterest)}
            {l.interestDueDay ? <span className="block text-[11px] text-muted">{ordinal(l.interestDueDay)} of month</span> : null}
          </>
        )}
      </td>
      <td className="py-3">
        <DueBadge l={l} />
      </td>
      <td className="py-3">
        <Tag tone={l.status === "closed" ? "neutral" : "success"}>{l.status === "closed" ? "Closed" : "Active"}</Tag>
      </td>
      <td className="py-3">
        <div className="flex items-center justify-end">
          <DownloadLendingPdf lending={l} />
          <LendingActionsMenu {...menuProps(l)} />
        </div>
      </td>
    </tr>
  );
}

function SortableCard({ l }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: l._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl bg-background p-3.5">
      <div className="flex items-center gap-2.5" onClick={() => router.push(`/lending/${l._id}`)}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
          className="flex h-6 w-6 shrink-0 touch-none items-center justify-center text-muted active:cursor-grabbing"
        >
          <GripVertical size={15} />
        </button>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
          {l.borrower.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{l.borrower}</p>
          <p className="truncate text-[11px] text-muted">
            Given {formatDateShort(l.dateGiven)} · {daysSince(l.dateGiven)}d ago
          </p>
        </div>
        <Tag tone={l.status === "closed" ? "neutral" : "success"}>{l.status === "closed" ? "Closed" : "Active"}</Tag>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border pt-3">
        <div>
          <p className="text-[10px] text-muted">Principal</p>
          <p className="text-sm font-semibold text-danger">{formatCurrencyPrecise(l.principal)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted">Outstanding</p>
          <p className="text-sm font-semibold text-warning">{formatCurrencyPrecise(l.outstanding)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted">Principal Paid</p>
          <p className="text-sm font-semibold text-success">{formatCurrencyPrecise(l.principalRepaid)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted">Interest Collected</p>
          <p className="text-sm font-semibold text-info">{formatCurrencyPrecise(l.interest)}</p>
        </div>
      </div>

      {l.status !== "closed" ? (
        <p className="mt-2.5 text-[11px] text-muted">
          Monthly due {formatCurrencyPrecise(l.monthlyInterest)}
          {l.interestDueDay ? ` · ${ordinal(l.interestDueDay)} of month` : ""}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-2.5">
        <DownloadLendingPdf lending={l} />
        <LendingActionsMenu {...menuProps(l)} />
      </div>
    </div>
  );
}

export default function LendingBorrowersTable({ summaries }) {
  const [prevSummaries, setPrevSummaries] = useState(summaries);
  const [items, setItems] = useState(summaries);
  if (summaries !== prevSummaries) {
    setPrevSummaries(summaries);
    setItems(summaries);
  }

  const isDesktop = useIsDesktop();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i._id === active.id);
    const newIndex = items.findIndex((i) => i._id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorderLendings(next.map((i) => i._id));
  }

  return (
    <DndContext id="lending-borrowers" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        {isDesktop ? (
          <table className="w-full min-w-180 border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-[11px] font-medium text-muted">Borrower</th>
                <th className="pb-2 text-[11px] font-medium text-muted">Principal</th>
                <th className="pb-2 text-[11px] font-medium text-muted">Outstanding</th>
                <th className="pb-2 text-[11px] font-medium text-muted">Interest Collected</th>
                <th className="pb-2 text-[11px] font-medium text-muted">Monthly Due</th>
                <th className="pb-2 text-[11px] font-medium text-muted">Next Due Date</th>
                <th className="pb-2 text-[11px] font-medium text-muted">Status</th>
                <th className="pb-2 text-right text-[11px] font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((l) => (
                <SortableRow key={l._id} l={l} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="space-y-3">
            {items.map((l) => (
              <SortableCard key={l._id} l={l} />
            ))}
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}
