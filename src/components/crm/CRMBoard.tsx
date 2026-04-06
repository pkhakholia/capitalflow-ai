"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  type UniqueIdentifier
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { Plus, Filter, Search } from "lucide-react";
import { InvestorCard } from "./InvestorCard";
import type { InvestorOutreach, OutreachStage } from "@/types/outreach";
import { STAGE_DISPLAY_NAMES, STAGE_COLORS, OUTREACH_STAGES } from "@/types/outreach";
import { updateInvestorOutreachStage } from "@/lib/outreach";

interface CRMBoardProps {
  outreachData: InvestorOutreach[];
  onOutreachUpdated: () => void;
  onContactInvestor?: (outreach: InvestorOutreach) => void;
}

const STAGES: OutreachStage[] = ["to_contact", "reached_out", "in_progress", "committed"];

export function CRMBoard({ outreachData, onOutreachUpdated, onContactInvestor }: CRMBoardProps) {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStage, setSelectedStage] = React.useState<OutreachStage | "all">("all");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Filter outreach data
  const filteredOutreach = React.useMemo(() => {
    return outreachData.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        (item.fund_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.investor_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = selectedStage === "all" || item.outreach_stage === selectedStage;

      return matchesSearch && matchesStage;
    });
  }, [outreachData, searchQuery, selectedStage]);

  // Group by stage
  const stageGroups = React.useMemo(() => {
    return STAGES.map((stage) => ({
      stage,
      items: filteredOutreach.filter((item) => item.outreach_stage === stage)
    }));
  }, [filteredOutreach]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItem = outreachData.find((item) => item.id === active.id);
    if (!activeItem) return;

    // Check if dropped over a different stage column
    const overId = over.id as string;
    const targetStage = STAGES.find((s) => s === overId);

    if (targetStage && targetStage !== activeItem.outreach_stage) {
      // Update the stage in the database
      const result = await updateInvestorOutreachStage(activeItem.id, targetStage);
      if (result.success) {
        onOutreachUpdated();
      }
    }
  };

  const activeOutreach = activeId
    ? outreachData.find((item) => item.id === activeId)
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Investor Pipeline</h2>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop investors to update their stage
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search investors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as OutreachStage | "all")}
                className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Stages</option>
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_DISPLAY_NAMES[stage]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-0 divide-x divide-gray-200">
          {stageGroups.map(({ stage, items }) => {
            const colors = STAGE_COLORS[stage];
            return (
              <div
                key={stage}
                id={stage}
                data-stage={stage}
                className={`min-h-[400px] bg-gray-50/50 ${colors.bg}`}
              >
                {/* Column Header */}
                <div className={`p-4 border-b ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors.text.replace("text-", "bg-")}`} />
                      <h3 className="font-semibold text-sm text-gray-900">
                        {STAGE_DISPLAY_NAMES[stage]}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-3 space-y-3">
                  <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((item) => (
                      <InvestorCard
                        key={item.id}
                        outreach={item}
                        onContactClick={() => onContactInvestor?.(item)}
                      />
                    ))}
                  </SortableContext>

                  {/* Empty State */}
                  {items.length === 0 && (
                    <div className="text-center py-8 px-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-400">No investors</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Drag investors here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeOutreach ? (
            <div className="opacity-90">
              <InvestorCard outreach={activeOutreach} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
