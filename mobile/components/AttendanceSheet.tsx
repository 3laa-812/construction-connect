import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import AttendanceCompany from "../db/models/AttendanceCompany";
import { hapticLight } from "../services/haptics";

export type AttendanceEntry = {
  id: string;
  company_name: string;
  trade: string;
  headcount: number;
  hours_worked: number;
};

/** @deprecated use AttendanceEntry */
export type AttendanceRow = AttendanceEntry;

export const TRADES = [
  "Carpenter",
  "Electrician",
  "Mason",
  "General Labor",
  "Other",
] as const;

const MAX_HEADCOUNT = 200;
const MAX_H = 16;
const MIN_H = 0.5;

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyAttendanceEntry(): AttendanceEntry {
  return {
    id: nextId(),
    company_name: "",
    trade: "General Labor",
    headcount: 1,
    hours_worked: 8,
  };
}

function rowErrors(
  row: AttendanceEntry,
  maxHoursPerPerson: number,
): string[] {
  const errs: string[] = [];
  if (!row.company_name.trim()) {
    errs.push("Enter company or 'Own Crew'");
  }
  if (row.headcount < 1) {
    errs.push("At least 1 worker");
  }
  if (row.headcount > MAX_HEADCOUNT) {
    errs.push(`Max ${MAX_HEADCOUNT} workers`);
  }
  if (row.hours_worked > maxHoursPerPerson) {
    errs.push("Max 16 hours per shift");
  }
  if (row.hours_worked < MIN_H && row.headcount >= 1) {
    errs.push(`Min ${MIN_H} hours`);
  }
  return errs;
}

/** True when Submit should be disabled (invalid rows present). */
export function attendanceBlocksSubmit(
  rows: AttendanceEntry[],
  maxHoursPerPerson = MAX_H,
): boolean {
  if (rows.length === 0) return false;
  return rows.some((r) => rowErrors(r, maxHoursPerPerson).length > 0);
}

interface AttendanceSheetProps {
  rows: AttendanceEntry[];
  onChange: (rows: AttendanceEntry[]) => void;
  maxHoursPerPerson?: number;
}

export default function AttendanceSheet({
  rows,
  onChange,
  maxHoursPerPerson = MAX_H,
}: AttendanceSheetProps) {
  const database = useDatabase();
  const [suggestions, setSuggestions] = useState<AttendanceCompany[]>([]);
  const [activeCompanyRow, setActiveCompanyRow] = useState<string | null>(
    null,
  );
  const [tradePickerRow, setTradePickerRow] = useState<string | null>(null);

  useEffect(() => {
    const sub = database
      .get<AttendanceCompany>("attendance_companies")
      .query(Q.sortBy("last_used_at", Q.desc))
      .observe()
      .subscribe(setSuggestions);
    return () => sub.unsubscribe();
  }, [database]);

  const patchRow = (id: string, partial: Partial<AttendanceEntry>) => {
    onChange(
      rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    );
  };

  const addRow = () => {
    hapticLight();
    onChange([...rows, emptyAttendanceEntry()]);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const filteredSuggestions = useMemo(() => {
    if (!activeCompanyRow) return [];
    const row = rows.find((r) => r.id === activeCompanyRow);
    const q = (row?.company_name ?? "").trim().toLowerCase();
    if (!q) return suggestions.slice(0, 8);
    return suggestions
      .filter((s) => s.companyName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [activeCompanyRow, rows, suggestions]);

  const totals = useMemo(() => {
    const workers = rows.reduce((s, r) => s + (r.headcount || 0), 0);
    const manHours = rows.reduce(
      (s, r) => s + (r.headcount || 0) * (r.hours_worked || 0),
      0,
    );
    return { workers, manHours };
  }, [rows]);

  return (
    <View className="bg-card p-4 rounded-xl border border-border mb-4">
      <Text className="text-lg font-bold text-foreground mb-2">Attendance</Text>
      <Text className="text-xs text-muted-foreground mb-3">
        Swipe row left to delete. Hours capped at {maxHoursPerPerson}h.
      </Text>

      {rows.map((row) => {
        const errs = rowErrors(row, maxHoursPerPerson);
        const hoursBad =
          row.hours_worked > maxHoursPerPerson || row.hours_worked < MIN_H;
        return (
          <Swipeable
            key={row.id}
            overshootRight={false}
            renderRightActions={() => (
              <TouchableOpacity
                onPress={() => removeRow(row.id)}
                className="bg-destructive justify-center px-4 mb-3 rounded-lg"
              >
                <Text className="text-white font-bold">Delete</Text>
              </TouchableOpacity>
            )}
          >
            <View
              className={`border rounded-lg p-3 mb-3 ${errs.length ? "border-destructive/80" : "border-border/60"}`}
            >
              <View className="mb-2">
                <Text className="text-xs text-muted-foreground mb-1">
                  Company
                </Text>
                <TextInput
                  className="bg-background text-foreground p-3 rounded-lg border border-border text-sm min-h-[48px]"
                  placeholder="Subcontractor or Own Crew"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  value={row.company_name}
                  onFocus={() => setActiveCompanyRow(row.id)}
                  onChangeText={(t) => patchRow(row.id, { company_name: t })}
                />
                {activeCompanyRow === row.id && filteredSuggestions.length > 0 ? (
                  <View className="border border-border rounded-lg mt-1 bg-background max-h-40">
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {filteredSuggestions.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          className="px-3 py-3 border-b border-border/40"
                          onPress={() => {
                            patchRow(row.id, { company_name: s.companyName });
                            setActiveCompanyRow(null);
                          }}
                        >
                          <Text className="text-foreground">{s.companyName}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
                {errs.filter((e) => e.includes("company")).map((e) => (
                  <Text key={e} className="text-destructive text-[10px] mt-1">
                    {e}
                  </Text>
                ))}
              </View>

              <View className="mb-2">
                <Text className="text-xs text-muted-foreground mb-1">Trade</Text>
                <TouchableOpacity
                  onPress={() => setTradePickerRow(row.id)}
                  className="bg-background border border-border rounded-lg p-3 min-h-[48px] justify-center"
                >
                  <Text className="text-foreground">{row.trade || "Pick trade"}</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-3 mb-2">
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground mb-1">
                    Headcount
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      className="bg-secondary w-10 h-12 rounded-lg items-center justify-center"
                      onPress={() =>
                        patchRow(row.id, {
                          headcount: Math.max(1, row.headcount - 1),
                        })
                      }
                    >
                      <Text className="text-lg font-bold text-foreground">−</Text>
                    </TouchableOpacity>
                    <TextInput
                      className="flex-1 bg-background text-foreground p-2 rounded-lg border border-border text-center text-sm min-h-[48px]"
                      keyboardType="number-pad"
                      value={String(row.headcount)}
                      onChangeText={(t) => {
                        const n = parseInt(t, 10);
                        patchRow(row.id, {
                          headcount: Number.isFinite(n)
                            ? Math.min(MAX_HEADCOUNT, Math.max(0, n))
                            : 1,
                        });
                      }}
                    />
                    <TouchableOpacity
                      className="bg-secondary w-10 h-12 rounded-lg items-center justify-center"
                      onPress={() =>
                        patchRow(row.id, {
                          headcount: Math.min(
                            MAX_HEADCOUNT,
                            row.headcount + 1,
                          ),
                        })
                      }
                    >
                      <Text className="text-lg font-bold text-foreground">+</Text>
                    </TouchableOpacity>
                  </View>
                  {errs.some((e) => e.includes("worker")) ? (
                    <Text className="text-destructive text-[10px] mt-1">
                      At least 1 worker
                    </Text>
                  ) : null}
                  {row.headcount > MAX_HEADCOUNT ? (
                    <Text className="text-destructive text-[10px] mt-1">
                      Max {MAX_HEADCOUNT} workers
                    </Text>
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground mb-1">
                    Hours
                  </Text>
                  <TextInput
                    className={`bg-background text-foreground p-3 rounded-lg border text-sm min-h-[48px] ${hoursBad ? "border-destructive" : "border-border"}`}
                    keyboardType="decimal-pad"
                    value={String(row.hours_worked)}
                    onChangeText={(t) => {
                      const n = parseFloat(t);
                      patchRow(row.id, {
                        hours_worked: Number.isFinite(n) ? n : MIN_H,
                      });
                    }}
                  />
                  {row.hours_worked > maxHoursPerPerson ? (
                    <Text className="text-destructive text-[10px] mt-1">
                      Max {maxHoursPerPerson} hours per shift
                    </Text>
                  ) : null}
                  {row.hours_worked < MIN_H && row.headcount >= 1 ? (
                    <Text className="text-destructive text-[10px] mt-1">
                      Min {MIN_H} hours
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </Swipeable>
        );
      })}

      <TouchableOpacity
        onPress={addRow}
        className="bg-secondary border border-primary/50 items-center py-3 rounded-lg min-h-[48px] justify-center"
      >
        <Text className="text-primary font-bold">+ Add row</Text>
      </TouchableOpacity>

      <View className="mt-4 p-3 rounded-lg bg-muted/40 border border-border">
        <Text className="text-sm font-semibold text-foreground">
          Total workers: {totals.workers} | Total man-hours:{" "}
          {totals.manHours.toFixed(1)}
        </Text>
      </View>

      <Modal visible={!!tradePickerRow} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setTradePickerRow(null)}
        >
          <Pressable className="bg-card rounded-t-2xl p-4 border-t border-border">
            <Text className="text-lg font-bold text-foreground mb-3">
              Select trade
            </Text>
            <ScrollView className="max-h-80">
              {TRADES.map((t) => (
                <TouchableOpacity
                  key={t}
                  className="py-4 border-b border-border"
                  onPress={() => {
                    if (tradePickerRow) {
                      patchRow(tradePickerRow, { trade: t });
                    }
                    setTradePickerRow(null);
                  }}
                >
                  <Text className="text-foreground text-base">{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
