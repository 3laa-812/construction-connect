import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

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

type Props = {
  notes: ProgressNote[];
  onChange: (notes: ProgressNote[]) => void;
  disabled?: boolean;
};

export function ProgressNotesSection({ notes, onChange, disabled }: Props) {
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
      <Text className="text-xs text-muted-foreground mb-3">
        Activities and progress for this day.
      </Text>
      {notes.map((note, index) => (
        <View
          key={`pn-${index}`}
          className="border border-border/70 rounded-lg p-3 mb-3"
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-semibold text-foreground">
              Activity {index + 1}
            </Text>
            <TouchableOpacity
              onPress={() => remove(index)}
              disabled={disabled}
              className="opacity-80"
            >
              <Text className="text-destructive text-xs font-bold">Remove</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-muted-foreground mb-1">Zone / area</Text>
          <TextInput
            className="bg-background text-foreground p-2 rounded-lg border border-border text-sm mb-2"
            placeholder="e.g. Floor 3 — East"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={note.zone}
            editable={!disabled}
            onChangeText={(t) => patch(index, { zone: t })}
          />
          <Text className="text-xs text-muted-foreground mb-1">Work done</Text>
          <TextInput
            className="bg-background text-foreground p-2 rounded-lg border border-border text-sm mb-2 min-h-[72px]"
            placeholder="What was completed today?"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={note.work_done}
            editable={!disabled}
            onChangeText={(t) => patch(index, { work_done: t })}
            multiline
            textAlignVertical="top"
          />
          <Text className="text-xs text-muted-foreground mb-1">
            % complete (0–100)
          </Text>
          <TextInput
            className="bg-background text-foreground p-2 rounded-lg border border-border text-sm mb-2"
            placeholder="0"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={String(note.percentage)}
            editable={!disabled}
            keyboardType="number-pad"
            onChangeText={(t) => {
              const n = Math.min(100, Math.max(0, parseInt(t, 10) || 0));
              patch(index, { percentage: Number.isFinite(n) ? n : 0 });
            }}
          />
          <Text className="text-xs text-muted-foreground mb-1">Issues</Text>
          <TextInput
            className="bg-background text-foreground p-2 rounded-lg border border-border text-sm"
            placeholder="Optional blockers or defects"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={note.issues}
            editable={!disabled}
            onChangeText={(t) => patch(index, { issues: t })}
            multiline
            textAlignVertical="top"
          />
        </View>
      ))}
      <TouchableOpacity
        onPress={add}
        disabled={disabled}
        className="bg-secondary py-3 rounded-lg items-center"
      >
        <Text className="text-secondary-foreground font-bold">
          + Add activity
        </Text>
      </TouchableOpacity>
    </View>
  );
}
