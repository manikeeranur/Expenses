"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";
import CategoryForm from "@/components/CategoryForm";
import CategoryActionsMenu from "@/components/CategoryActionsMenu";
import { formatCurrency } from "@/lib/format";
import { updateCategory, deleteCategory, reorderCategories } from "@/lib/actions/categories";

function SortableCategoryRow({ c, totalExpenses }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => router.push(`/categories/${c._id}`)}
      className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]"
    >
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
      <CategoryIcon icon={c.icon} color={c.color} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{c.name}</p>
        <p className="text-xs text-muted">{totalExpenses > 0 ? `${c.percent}% of total expenses` : "No spending yet"}</p>
      </div>
      <p className="text-sm font-semibold">{formatCurrency(c.spent)}</p>
      <CategoryActionsMenu
        editSlot={<CategoryForm mode="menu" action={updateCategory.bind(null, c._id)} defaults={c} />}
        deleteAction={deleteCategory.bind(null, c._id)}
      />
    </div>
  );
}

export default function CategoryList({ categories, totalExpenses }) {
  const [prevCategories, setPrevCategories] = useState(categories);
  const [items, setItems] = useState(categories);
  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setItems(categories);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i._id === active.id);
    const newIndex = items.findIndex((i) => i._id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorderCategories(next.map((i) => i._id));
  }

  return (
    <DndContext id="categories" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 px-4 pt-3">
          {items.map((c) => (
            <SortableCategoryRow key={c._id} c={c} totalExpenses={totalExpenses} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
