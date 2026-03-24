import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Q } from "@nozbe/watermelondb";
import api from "../services/api";
import { database } from "../db";
import SiteInventory from "../db/models/SiteInventory";

export interface ReceivedItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
}

export type MaterialReceiptData = {
  version: 2;
  legacyItems?: ReceivedItem[];
  lastPoId?: string;
  lastSubmittedGrnAt?: number;
  /** Optional free text from new-log screen */
  work_notes?: string;
};

type PoSummary = {
  id: string;
  status: string;
  project_id: string;
};

type PoLine = {
  id: string;
  item_description: string | null;
  ordered_qty: string | number | null;
  remaining_qty: number;
};

type PoDetail = {
  id: string;
  status: string;
  project_id: string;
  items: PoLine[];
};

const OPEN_PO = new Set([
  "CONFIRMED",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
]);

interface MaterialReceiptFormProps {
  /** Backend `Project.id` — set on local Project.server_id when syncing. */
  projectServerId: string | null;
  /** Local Watermelon `projects.id` for inventory rows. */
  localProjectId: string;
  value: MaterialReceiptData;
  onPatch: (patch: Partial<MaterialReceiptData>) => void;
}

async function addToSiteInventory(
  localProjectId: string,
  lines: { name: string; unit: string; qty: number }[],
) {
  const col = database.get<SiteInventory>("site_inventory");
  const now = Date.now();
  await database.write(async () => {
    for (const line of lines) {
      const found = await col
        .query(
          Q.and(
            Q.where("project_id", localProjectId),
            Q.where("name", line.name),
          ),
        )
        .fetch();
      if (found.length > 0) {
        const row = found[0];
        await row.update((r) => {
          r.quantity += line.qty;
          r.unit = line.unit;
          r.updatedAt = now;
        });
      } else {
        await col.create((r) => {
          r.projectId = localProjectId;
          r.name = line.name;
          r.unit = line.unit;
          r.quantity = line.qty;
          r.updatedAt = now;
        });
      }
    }
  });
}

export default function MaterialReceiptForm({
  projectServerId,
  localProjectId,
  value,
  onPatch,
}: MaterialReceiptFormProps) {
  const [poList, setPoList] = useState<PoSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedPoId, setSelectedPoId] = useState<string | null>(
    value.lastPoId ?? null,
  );
  const [poDetail, setPoDetail] = useState<PoDetail | null>(null);
  const [loadingPo, setLoadingPo] = useState(false);

  const [lineState, setLineState] = useState<
    Record<string, { checked: boolean; receivedQty: string }>
  >({});

  const [submitting, setSubmitting] = useState(false);

  const filteredPos = useMemo(() => {
    if (!projectServerId) return [];
    return poList.filter(
      (p) => p.project_id === projectServerId && OPEN_PO.has(p.status),
    );
  }, [poList, projectServerId]);

  const loadPoList = useCallback(async () => {
    if (!projectServerId) return;
    setLoadingList(true);
    setListError(null);
    try {
      const res = await api.get<PoSummary[]>("/purchase-orders");
      setPoList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setListError("Could not load purchase orders.");
      setPoList([]);
    } finally {
      setLoadingList(false);
    }
  }, [projectServerId]);

  useEffect(() => {
    loadPoList();
  }, [loadPoList]);

  const loadPoDetail = useCallback(async (poId: string) => {
    setLoadingPo(true);
    setPoDetail(null);
    setLineState({});
    try {
      const res = await api.get<PoDetail>(`/purchase-orders/${poId}`);
      const detail = res.data;
      setPoDetail(detail);
      const init: Record<string, { checked: boolean; receivedQty: string }> =
        {};
      for (const it of detail.items || []) {
        if (it.remaining_qty > 0) {
          init[it.id] = { checked: false, receivedQty: "" };
        }
      }
      setLineState(init);
    } catch {
      Alert.alert("Error", "Could not load PO lines.");
    } finally {
      setLoadingPo(false);
    }
  }, []);

  useEffect(() => {
    if (value.lastPoId) {
      setSelectedPoId(value.lastPoId);
    }
  }, [value.lastPoId]);

  useEffect(() => {
    if (!selectedPoId || !projectServerId) {
      setPoDetail(null);
      setLineState({});
      return;
    }
    void loadPoDetail(selectedPoId);
  }, [selectedPoId, projectServerId, loadPoDetail]);

  const toggleLine = (poItemId: string) => {
    setLineState((prev) => ({
      ...prev,
      [poItemId]: {
        ...prev[poItemId],
        checked: !prev[poItemId]?.checked,
      },
    }));
  };

  const setQty = (poItemId: string, text: string) => {
    setLineState((prev) => ({
      ...prev,
      [poItemId]: { ...prev[poItemId], receivedQty: text },
    }));
  };

  const submitGrn = async () => {
    if (!selectedPoId || !poDetail) {
      Alert.alert("Select a PO", "Choose a purchase order first.");
      return;
    }
    const items: { po_item_id: string; delivered_qty: number }[] = [];
    for (const line of poDetail.items) {
      const st = lineState[line.id];
      if (!st?.checked) continue;
      const qty = parseFloat(st.receivedQty.replace(",", "."));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (qty > line.remaining_qty) {
        Alert.alert(
          "Invalid qty",
          `Line exceeds remaining (${line.remaining_qty}).`,
        );
        return;
      }
      items.push({ po_item_id: line.id, delivered_qty: qty });
    }
    if (!items.length) {
      Alert.alert("GRN", "Select at least one line and enter received quantity.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/purchase-orders/${selectedPoId}/delivery-notes`, {
        status: "DELIVERED",
        items,
      });

      const invLines = items.map((it) => {
        const line = poDetail.items.find((i) => i.id === it.po_item_id)!;
        return {
          name: line.item_description || "Material",
          unit: "unit",
          qty: it.delivered_qty,
        };
      });
      await addToSiteInventory(localProjectId, invLines);

      onPatch({
        lastSubmittedGrnAt: Date.now(),
        lastPoId: selectedPoId,
      });

      Alert.alert("Saved", "Goods receipt recorded and local inventory updated.");
      await loadPoDetail(selectedPoId);
      await loadPoList();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      Alert.alert("GRN failed", String(msg ?? "Request failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const legacy = value.legacyItems?.length ? value.legacyItems : null;

  return (
    <View className="bg-card p-4 rounded-xl border border-border mb-4">
      <Text className="text-lg font-bold text-foreground mb-1">
        Material receipt (GRN)
      </Text>
      {!projectServerId ? (
        <Text className="text-sm text-muted-foreground mb-2">
          Set a backend project id on this project (Project.server_id) to load
          purchase orders and submit GRNs.
        </Text>
      ) : null}

      {loadingList ? (
        <ActivityIndicator className="my-2" />
      ) : listError ? (
        <Text className="text-destructive text-sm mb-2">{listError}</Text>
      ) : null}

      <Text className="text-xs text-muted-foreground mb-2">
        Open PO for this site
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 max-h-28"
      >
        {filteredPos.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => {
              setSelectedPoId(p.id);
              onPatch({ lastPoId: p.id });
            }}
            className={`mr-2 px-3 py-2 rounded-lg border ${
              selectedPoId === p.id
                ? "bg-primary/20 border-primary"
                : "bg-background border-border"
            }`}
          >
            <Text className="text-xs text-foreground font-mono">
              {p.id.slice(0, 8)}…
            </Text>
            <Text className="text-[10px] text-muted-foreground">{p.status}</Text>
          </TouchableOpacity>
        ))}
        {projectServerId && !filteredPos.length && !loadingList ? (
          <Text className="text-xs text-muted-foreground self-center">
            No open POs for this project.
          </Text>
        ) : null}
      </ScrollView>

      {loadingPo ? <ActivityIndicator className="my-2" /> : null}

      {poDetail ? (
        <View className="mb-3">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Line items (remaining qty)
          </Text>
          {(poDetail.items || []).map((line) => {
            if (line.remaining_qty <= 0) return null;
            const st = lineState[line.id] || {
              checked: false,
              receivedQty: "",
            };
            return (
              <View
                key={line.id}
                className="flex-row items-center border-b border-border/40 py-2 gap-2"
              >
                <TouchableOpacity
                  onPress={() => toggleLine(line.id)}
                  className="w-6 h-6 border border-border rounded items-center justify-center"
                >
                  {st.checked ? (
                    <Text className="text-primary font-bold text-xs">✓</Text>
                  ) : null}
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="text-foreground text-sm">
                    {line.item_description || "Item"}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground">
                    Remaining: {line.remaining_qty}
                  </Text>
                </View>
                <TextInput
                  className="w-20 bg-background border border-border rounded px-2 py-1 text-foreground text-sm"
                  placeholder="Qty"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  keyboardType="decimal-pad"
                  editable={st.checked}
                  value={st.receivedQty}
                  onChangeText={(t) => setQty(line.id, t)}
                />
              </View>
            );
          })}
          <TouchableOpacity
            onPress={submitGrn}
            disabled={submitting}
            className="bg-primary py-3 rounded-lg items-center mt-2"
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-bold">
                Submit GRN to server
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {legacy ? (
        <View className="mt-3 pt-3 border-t border-border">
          <Text className="text-xs text-muted-foreground mb-2">
            Legacy offline list (reference)
          </Text>
          {legacy.map((item) => (
            <Text key={item.id} className="text-sm text-foreground">
              {item.description} — {item.quantity} {item.unit}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
