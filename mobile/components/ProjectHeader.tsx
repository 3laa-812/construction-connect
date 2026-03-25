import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import { Feather } from "@expo/vector-icons";
import Project from "../db/models/Project";
import { useProjectStore } from "../store/projectStore";
import { hapticLight } from "../services/haptics";

export function ProjectHeader() {
  const database = useDatabase();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const hydrateFromStorage = useProjectStore((s) => s.hydrateFromStorage);

  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>("Select project");

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    const sub = database
      .get<Project>("projects")
      .query()
      .observe()
      .subscribe(setProjects);
    return () => sub.unsubscribe();
  }, [database]);

  useEffect(() => {
    if (!activeProjectId) {
      setName("Select project");
      return;
    }
    const p = projects.find((x) => x.id === activeProjectId);
    setName(p?.name ?? "Project");
  }, [activeProjectId, projects]);

  const onPick = async (id: string) => {
    hapticLight();
    await setActiveProjectId(id);
    setOpen(false);
  };

  return (
    <>
      <SafeAreaView edges={["top"]} className="bg-card border-b border-border">
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            setOpen(true);
          }}
          className="min-h-[48px] px-4 flex-row items-center justify-between"
          accessibilityRole="button"
          accessibilityLabel="Choose active project"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <Feather name="chevron-down" size={22} color="hsl(var(--foreground))" />
            <Text
              className="text-base font-semibold text-foreground ml-2 flex-1"
              numberOfLines={1}
            >
              {name}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground uppercase tracking-wide">
            Site
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={open} animationType="slide" transparent>
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="bg-card rounded-t-3xl max-h-[70%] pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-4 border-b border-border">
              <Text className="text-lg font-bold text-foreground">
                Active project
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Superintendent data is scoped to one site at a time.
              </Text>
            </View>
            <FlatList
              data={projects}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onPick(item.id)}
                  className={`min-h-[48px] px-4 py-3 border-b border-border flex-row justify-between items-center ${
                    item.id === activeProjectId ? "bg-primary/10" : ""
                  }`}
                >
                  <Text className="text-base text-foreground flex-1 font-medium">
                    {item.name}
                  </Text>
                  {item.id === activeProjectId ? (
                    <Feather name="check" size={20} color="hsl(var(--primary))" />
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="text-muted-foreground text-center py-8 px-4">
                  No projects yet. Sync after login.
                </Text>
              }
            />
            <TouchableOpacity
              onPress={() => setOpen(false)}
              className="min-h-[48px] mx-4 mt-2 rounded-xl bg-muted items-center justify-center"
            >
              <Text className="text-foreground font-semibold text-base">Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
