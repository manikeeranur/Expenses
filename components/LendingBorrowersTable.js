"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Tag from "@/components/ui/Tag";
import LendingActionsMenu from "@/components/LendingActionsMenu";
import LendingForm from "@/components/LendingForm";
import SendReminderButton from "@/components/SendReminderButton";
import { formatCurrencyPrecise, formatDateShort, daysSince, ordinal } from "@/lib/format";
import { setLendingStatus, deleteLending, sendReminder, updateLending, reorderLendings } from "@/lib/actions/lending";

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
      <td className="py-3 text-sm font-semibold text-danger">{formatCurrencyPrecise(l.principal)}</td>
      <td className="py-3 text-sm font-semibold text-success">{formatCurrencyPrecise(l.principalRepaid)}</td>
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
        <Tag tone={l.status === "closed" ? "neutral" : "success"}>{l.status === "closed" ? "Closed" : "Active"}</Tag>
      </td>
      <td className="py-3">
        <div className="flex items-center justify-end">
          <LendingActionsMenu
            isClosed={l.status === "closed"}
            statusAction={setLendingStatus.bind(null, l._id, l.status === "closed" ? "active" : "closed")}
            deleteAction={deleteLending.bind(null, l._id)}
            editSlot={<LendingForm action={updateLending.bind(null, l._id)} defaults={l} variant="menu" />}
            reminderSlot={<SendReminderButton action={sendReminder.bind(null, l._id)} variant="menu" />}
          />
        </div>
      </td>
    </tr>
  );
}

export default function LendingBorrowersTable({ summaries }) {
  const [prevSummaries, setPrevSummaries] = useState(summaries);
  const [items, setItems] = useState(summaries);
  if (summaries !== prevSummaries) {
    setPrevSummaries(summaries);
    setItems(summaries);
  }

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
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-2 text-[11px] font-medium text-muted">Borrower</th>
            <th className="pb-2 text-[11px] font-medium text-muted">Principal</th>
            <th className="pb-2 text-[11px] font-medium text-muted">Principal Paid</th>
            <th className="pb-2 text-[11px] font-medium text-muted">Outstanding</th>
            <th className="pb-2 text-[11px] font-medium text-muted">Interest Collected</th>
            <th className="pb-2 text-[11px] font-medium text-muted">Monthly Due</th>
            <th className="pb-2 text-[11px] font-medium text-muted">Status</th>
            <th className="pb-2 text-right text-[11px] font-medium text-muted">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
            {items.map((l) => (
              <SortableRow key={l._id} l={l} />
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
}
