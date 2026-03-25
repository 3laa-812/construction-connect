import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Q } from "@nozbe/watermelondb";
import { database } from "../../db";
import PurchaseOrder from "../../db/models/PurchaseOrder";
import POItem from "../../db/models/POItem";
import Project from "../../db/models/Project";
import GrnRecord from "../../db/models/GrnRecord";
import { DailyLogPhotosSection, type DailyLogPhotoItem } from "../../components/DailyLogPhotosSection";
import { hapticError, hapticSuccess } from "../../services/haptics";

const CLOSED_PO = new Set([
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "CLOSED",
]);

type LineState = {
  poItemId: string;
  name: string;
  ordered: number;
  prevReceived: number;
  receiveNow: number;
  condition: "Good" | "Damaged" | "Rejected";
};

export default function GrnWizardScreen() {
  const router = useRouter();
  const { projectId: projectIdParam } = useLocalSearchParams<{
    projectId?: string | string[];
  }>();
  const [projectId, setProjectId] = useState(
    (Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam) ??
      "",
  );
  const [step, setStep] = useState(1);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [lines, setLines] = useState<LineState[]>([]);
  const [ticketPhotos, setTicketPhotos] = useState<DailyLogPhotoItem[]>([]);
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      if (!projectId) {
        const projects = await database
          .get<Project>("projects")
          .query()
          .fetch();
        const pid = projects[0]?.id ?? "";
        setProjectId(pid);
        if (!pid) {
          setOrders([]);
          return;
        }
        const list = await database
          .get<PurchaseOrder>("purchase_orders")
          .query(Q.where("project_id", pid), Q.sortBy("updated_at", Q.desc))
          .fetch();
        setOrders(
          list.filter((o) => !CLOSED_PO.has(String(o.status).toUpperCase())),
        );
      } else {
        const list = await database
          .get<PurchaseOrder>("purchase_orders")
          .query(
            Q.where("project_id", projectId),
            Q.sortBy("updated_at", Q.desc),
          )
          .fetch();
        setOrders(
          list.filter((o) => !CLOSED_PO.has(String(o.status).toUpperCase())),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const selectPo = async (po: PurchaseOrder) => {
    setSelectedPo(po);
    const items = await database
      .get<POItem>("po_items")
      .query(Q.where("po_id", po.id))
      .fetch();
    setLines(
      items.map((it) => ({
        poItemId: it.id,
        name: it.name,
        ordered: Number(it.quantity) || 0,
        prevReceived: Number(it.receivedQty ?? 0),
        receiveNow: 0,
        condition: "Good",
      })),
    );
    setStep(2);
  };

  const patchLine = (id: string, patch: Partial<LineState>) => {
    setLines((ls) =>
      ls.map((l) => (l.poItemId === id ? { ...l, ...patch } : l)),
    );
  };

  const confirm = async () => {
    if (!selectedPo) return;
    const poServerKey =
      (selectedPo.serverId && selectedPo.serverId.trim()) || selectedPo.id;
    if (ticketPhotos.length < 1) {
      hapticError();
      Alert.alert("Photo required", "Add a photo of the delivery ticket.");
      return;
    }
    const itemsPayload = lines
      .filter((l) => l.receiveNow > 0)
      .map((l) => ({
        po_item_id: l.poItemId,
        received_qty: l.receiveNow,
        condition: l.condition,
      }));
    if (!itemsPayload.length) {
      hapticError();
      Alert.alert("Quantities", "Enter quantities to receive.");
      return;
    }

    setSaving(true);
    try {
      await database.write(async () => {
        await database.get<GrnRecord>("grn_records").create((r) => {
          r.poLocalId = selectedPo.id;
          r.poServerId = poServerKey;
          r.itemsJson = JSON.stringify(itemsPayload);
          r.notes = ticketPhotos[0]?.uri ?? "";
          r.synced = 0;
        });
        for (const l of lines) {
          if (l.receiveNow <= 0) continue;
          const rec = await database.get<POItem>("po_items").find(l.poItemId);
          await rec.update((it) => {
            it.receivedQty =
              (it.receivedQty ?? 0) + l.receiveNow;
          });
        }
      });
      hapticSuccess();
      Alert.alert("Saved", "Receipt recorded offline. It will sync automatically.");
      router.back();
    } catch (e) {
      console.error(e);
      hapticError();
      Alert.alert("Error", "Could not save GRN.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="hsl(var(--primary))" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Goods receipt (GRN)" }} />
      <View className="px-4 py-3 border-b border-border flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-muted-foreground">Close</Text>
        </TouchableOpacity>
        <Text className="font-bold text-foreground">Step {step} / 4</Text>
        <View style={{ width: 48 }} />
      </View>

      {step === 1 ? (
        <ScrollView className="flex-1 p-4">
          <Text className="text-lg font-bold mb-2">Select purchase order</Text>
          {orders.length === 0 ? (
            <View className="py-8">
              <Text className="text-muted-foreground text-center mb-4">
                No open orders for this project. Pull to sync or use Marketplace.
              </Text>
              <TouchableOpacity
                className="bg-primary py-4 rounded-xl items-center"
                onPress={() => router.push("/(tabs)/marketplace")}
              >
                <Text className="text-primary-foreground font-bold">
                  Go to Marketplace
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((po) => (
              <TouchableOpacity
                key={po.id}
                className="bg-card border border-border rounded-xl p-4 mb-3"
                onPress={() => selectPo(po)}
              >
                <Text className="font-bold text-foreground">PO {po.serverId ?? po.id.slice(0, 8)}</Text>
                <Text className="text-muted-foreground text-sm">
                  Status: {po.status}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : null}

      {step === 2 && selectedPo ? (
        <ScrollView className="flex-1 p-4">
          <Text className="text-lg font-bold mb-3">Verify quantities</Text>
          {lines.map((l) => {
            const maxRecv = Math.max(0, l.ordered - l.prevReceived);
            return (
              <View
                key={l.poItemId}
                className="bg-card border border-border rounded-xl p-3 mb-3"
              >
                <Text className="font-semibold text-foreground">{l.name}</Text>
                <Text className="text-xs text-muted-foreground">
                  Ordered: {l.ordered} · Already received: {l.prevReceived}
                </Text>
                <Text className="text-xs mt-2 mb-1">Receiving now (max {maxRecv})</Text>
                <TextInput
                  className="bg-background border border-border rounded-lg p-3 text-foreground mb-2"
                  keyboardType="number-pad"
                  value={String(l.receiveNow)}
                  onChangeText={(t) => {
                    const n = parseFloat(t) || 0;
                    patchLine(l.poItemId, {
                      receiveNow: Math.min(maxRecv, Math.max(0, n)),
                    });
                  }}
                />
                <View className="flex-row flex-wrap gap-2">
                  {(["Good", "Damaged", "Rejected"] as const).map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => patchLine(l.poItemId, { condition: c })}
                      className={`px-3 py-2 rounded-lg border ${l.condition === c ? "border-primary bg-primary/15" : "border-border"}`}
                    >
                      <Text className="text-xs font-bold text-foreground">{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
          <TouchableOpacity
            className="bg-primary py-4 rounded-xl items-center mt-2"
            onPress={() => setStep(3)}
          >
            <Text className="text-primary-foreground font-bold">Next: ticket photo</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}

      {step === 3 ? (
        <ScrollView className="flex-1 p-4">
          <Text className="text-lg font-bold mb-2">Delivery ticket photo</Text>
          <Text className="text-muted-foreground text-sm mb-3">
            Photo of the paper delivery note (required).
          </Text>
          <DailyLogPhotosSection
            items={ticketPhotos}
            onChange={setTicketPhotos}
          />
          <TouchableOpacity
            className="bg-primary py-4 rounded-xl items-center mt-6"
            disabled={ticketPhotos.length < 1}
            onPress={() => setStep(4)}
          >
            <Text className="text-primary-foreground font-bold">Review</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}

      {step === 4 && selectedPo ? (
        <ScrollView className="flex-1 p-4">
          <Text className="text-lg font-bold mb-3">Confirm receipt</Text>
          <Text className="text-foreground mb-4">
            PO {selectedPo.serverId ?? selectedPo.id.slice(0, 8)} —{" "}
            {lines.filter((l) => l.receiveNow > 0).length} line(s) with qty.
          </Text>
          <TouchableOpacity
            className="bg-primary py-4 rounded-xl items-center"
            disabled={saving}
            onPress={confirm}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-bold">
                Confirm receipt
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
