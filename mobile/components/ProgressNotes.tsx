import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";

export type ProgressNote = {
  zone: string;
  work_done: string;
  percentage: number;
  issues: string;
};

function emptyNote(): ProgressNote {
  return {
    zone: "",
    work_done: "",
    percentage: 0,
    issues: "",
  };
}

export function parseProgressNotes(raw: string | undefined | null): ProgressNote[] {
  if (!raw) return [emptyNote()];
  try {
    const p = JSON.parse(raw) as unknown;
    if (Array.isArray(p) && p.length > 0) {
      return p.map((row) => ({
        zone: String((row as ProgressNote).zone ?? ""),
        work_done: String((row as ProgressNote).work_done ?? ""),
        percentage: Math.min(
          100,
          Math.max(0, Number((row as ProgressNote).percentage) || 0),
        ),
        issues: String((row as ProgressNote).issues ?? ""),
      }));
    }
  } catch {
    /* ignore */
  }
  return [emptyNote()];
}

function snap5(n: number) {
  return Math.round(n / 5) * 5;
}

type Props = {
  notes: ProgressNote[];
  onChange: (notes: ProgressNote[]) => void;
  disabled?: boolean;
};

export function ProgressNotes({
  notes,
  onChange,
  disabled,
}: Props) {
  const [expandedWork, setExpandedWork] = useState<Record<string, boolean>>({});
  const [issueOpen, setIssueOpen] = useState<Record<number, boolean>>({});

  const patch = (index: number, partial: Partial<ProgressNote>) => {
    onChange(
      notes.map((n, i) => (i === index ? { ...n, ...partial } : n)),
    );
  };

  const add = () => {
    onChange([...notes, emptyNote()]);
  };

  const remove = (index: number) => {
    if (notes.length <= 1) {
      onChange([emptyNote()]);
      return;
    }
    onChange(notes.filter((_, i) => i !== index));
  };

  return (
    <View>
      {notes.map((note, index) => {
        const key = `${index}`;
        const workExpanded = expandedWork[key];
        return (
          <View
            key={`pn-${index}`}
            className="border border-border/70 rounded-lg p-3 mb-3"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-semibold text-foreground">
                Activity {index + 1}
              </Text>
              <TouchableOpacity onPress={() => remove(index)} disabled={disabled}>
                <Text className="text-destructive text-xs font-bold">Remove</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-muted-foreground mb-1">Zone / area</Text>
            <TextInput
              className="bg-background text-foreground p-3 rounded-lg border border-border text-sm mb-2 min-h-[48px]"
              placeholder="e.g. Floor 3 — East Wing"
              placeholderTextColor="hsl(var(--muted-foreground))"
              value={note.zone}
              editable={!disabled}
              onChangeText={(t) => patch(index, { zone: t })}
            />

            <Text className="text-xs text-muted-foreground mb-1">Work done</Text>
            <TextInput
              className="bg-background text-foreground p-3 rounded-lg border border-border text-sm mb-2"
              placeholder="What was completed?"
              placeholderTextColor="hsl(var(--muted-foreground))"
              value={note.work_done}
              editable={!disabled}
              onChangeText={(t) => patch(index, { work_done: t })}
              multiline
              numberOfLines={workExpanded ? 8 : 3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={() =>
                setExpandedWork((s) => ({ ...s, [key]: !workExpanded }))
              }
            >
              <Text className="text-primary text-xs font-semibold mb-2">
                {workExpanded ? "Show less" : "Expand"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-3 mb-2">
              <Text className="text-muted-foreground text-sm w-12 font-bold">
                {snap5(note.percentage)}%
              </Text>
              <Slider
                style={{ flex: 1, height: 40 }}
                minimumValue={0}
                maximumValue={100}
                step={5}
                value={snap5(note.percentage)}
                onValueChange={(v) => patch(index, { percentage: snap5(v) })}
                minimumTrackTintColor="hsl(var(--primary))"
                maximumTrackTintColor="hsl(var(--muted))"
                disabled={disabled}
              />
            </View>

            {note.issues || issueOpen[index] ? (
              <View>
                <Text className="text-xs text-muted-foreground mb-1">Issues</Text>
                <TextInput
                  className="bg-background text-foreground p-3 rounded-lg border border-border text-sm"
                  placeholder="Blockers or defects"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  value={note.issues}
                  editable={!disabled}
                  onChangeText={(t) => patch(index, { issues: t })}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() =>
                  setIssueOpen((s) => ({ ...s, [index]: true }))
                }
                disabled={disabled}
              >
                <Text className="text-amber-600 text-sm font-semibold">
                  ⚠️ Add issue
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
      <TouchableOpacity
        onPress={add}
        disabled={disabled}
        className="bg-secondary py-3 rounded-lg items-center min-h-[48px] justify-center"
      >
        <Text className="text-secondary-foreground font-bold">
          + Add activity
        </Text>
      </TouchableOpacity>
    </View>
  );
}
