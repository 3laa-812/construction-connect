import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

export type AttendanceRow = {
  id: string;
  company: string;
  trade: string;
  headcount: number;
  hours_worked: number;
};

interface AttendanceSheetProps {
  rows: AttendanceRow[];
  onChange: (rows: AttendanceRow[]) => void;
  /** Max hours per person per day (REQ-DL-02). */
  maxHoursPerPerson?: number;
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AttendanceSheet({
  rows,
  onChange,
  maxHoursPerPerson = 16,
}: AttendanceSheetProps) {
  const patchRow = (id: string, partial: Partial<AttendanceRow>) => {
    onChange(
      rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    );
  };

  const addRow = () => {
    onChange([
      ...rows,
      {
        id: nextId(),
        company: "",
        trade: "",
        headcount: 0,
        hours_worked: 8,
      },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  return (
    <View className="bg-card p-4 rounded-xl border border-border mb-4">
      <Text className="text-lg font-bold text-foreground mb-2">Attendance</Text>
      <Text className="text-xs text-muted-foreground mb-3">
        Subcontractor matrix — hours per person capped at {maxHoursPerPerson}h.
      </Text>

      {rows.map((row) => {
        const hoursInvalid =
          row.hours_worked > maxHoursPerPerson || row.hours_worked < 0;
        return (
          <View
            key={row.id}
            className="border border-border/60 rounded-lg p-3 mb-3"
          >
            <View className="flex-row gap-2 mb-2">
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground mb-1">
                  Company
                </Text>
                <TextInput
                  className="bg-background text-foreground p-2 rounded-lg border border-border text-sm"
                  placeholder="Subcontractor"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  value={row.company}
                  onChangeText={(t) => patchRow(row.id, { company: t })}
                />
              </View>
              <TouchableOpacity
                onPress={() => removeRow(row.id)}
                className="justify-end pb-1 px-2"
              >
                <Text className="text-destructive text-xs font-bold">✕</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2 mb-2">
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground mb-1">Trade</Text>
                <TextInput
                  className="bg-background text-foreground p-2 rounded-lg border border-border text-sm"
                  placeholder="e.g. Carpenter"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  value={row.trade}
                  onChangeText={(t) => patchRow(row.id, { trade: t })}
                />
              </View>
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground mb-1">
                  Headcount
                </Text>
                <TextInput
                  className="bg-background text-foreground p-2 rounded-lg border border-border text-sm"
                  placeholder="0"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  keyboardType="numeric"
                  value={row.headcount ? String(row.headcount) : ""}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    patchRow(row.id, {
                      headcount: Number.isFinite(n) ? Math.max(0, n) : 0,
                    });
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground mb-1">
                  Hours worked
                </Text>
                <TextInput
                  className={`bg-background text-foreground p-2 rounded-lg border text-sm ${
                    hoursInvalid ? "border-destructive" : "border-border"
                  }`}
                  placeholder="8"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  keyboardType="decimal-pad"
                  value={String(row.hours_worked)}
                  onChangeText={(t) => {
                    const n = parseFloat(t);
                    patchRow(row.id, {
                      hours_worked: Number.isFinite(n)
                        ? Math.max(0, n)
                        : 0,
                    });
                  }}
                />
                {hoursInvalid && (
                  <Text className="text-destructive text-[10px] mt-1">
                    Max {maxHoursPerPerson}h
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        onPress={addRow}
        className="bg-secondary border border-primary/50 items-center py-3 rounded-lg"
      >
        <Text className="text-primary font-bold">+ Add row</Text>
      </TouchableOpacity>
    </View>
  );
}
