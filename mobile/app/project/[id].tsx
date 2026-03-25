import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { withObservables } from "@nozbe/watermelondb/react";
import { database } from "../../db";
import Project from "../../db/models/Project";
import { Feather } from "@expo/vector-icons";

// Project Details Component
const ProjectDetails = ({ project }: { project: Project }) => {
  if (!project)
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Project not found</Text>
      </View>
    );

  return (
    <ScrollView className="flex-1 bg-background">
      <Stack.Screen
        options={{ title: project.name, headerBackTitle: "Projects" }}
      />

      {/* Overview Section */}
      <View className="p-4">
        <View className="bg-card p-4 rounded-xl border border-border mb-4 shadow-sm">
          <Text className="text-muted-foreground text-sm uppercase font-bold mb-1">
            Status
          </Text>
          <View className="flex-row items-center">
            <View
              className={`w-3 h-3 rounded-full mr-2 ${project.status === "Active" ? "bg-green-500" : "bg-gray-400"}`}
            />
            <Text className="text-xl font-bold text-foreground">
              {project.status || "Active"}
            </Text>
          </View>
        </View>

        {/* Progress Section */}
        <View className="bg-card p-4 rounded-xl border border-border mb-4 shadow-sm">
          <Text className="text-muted-foreground text-sm uppercase font-bold mb-3">
            Overall Progress
          </Text>
          <View className="h-4 bg-muted rounded-full overflow-hidden">
            <View className="h-full bg-primary w-[65%]" />
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-foreground font-bold">65% Complete</Text>
            <Text className="text-muted-foreground">Nov 15 Deadline</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text className="text-xl font-bold text-foreground mb-3 mt-2">
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap justify-between">
          <ActionButton
            icon="shopping-cart"
            label="Order Material"
            color="blue"
          />
          <ActionButton icon="clipboard" label="Daily Log" color="orange" />
          <ActionButton icon="camera" label="Site Photos" color="purple" />
          <ActionButton icon="users" label="Team" color="green" />
        </View>

        {/* Active Orders Preview */}
        <Text className="text-xl font-bold text-foreground mb-3 mt-6">
          Active Orders
        </Text>
        <TouchableOpacity className="bg-card p-4 rounded-xl border border-border mb-3 flex-row justify-between items-center">
          <View>
            <Text className="font-bold text-foreground">PO-900 • BuildPro</Text>
            <Text className="text-muted-foreground text-sm">
              Arriving Tomorrow
            </Text>
          </View>
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-700 text-xs font-bold">In Transit</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const ActionButton = ({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
}) => (
  <TouchableOpacity className="bg-card w-[48%] p-4 rounded-xl border border-border mb-3 items-center justify-center shadow-sm">
    <View
      className={`w-12 h-12 rounded-full items-center justify-center mb-2 bg-${color}-100`}
    >
      <Feather name={icon} size={24} color="#333" />
    </View>
    <Text className="font-semibold text-foreground">{label}</Text>
  </TouchableOpacity>
);

// Enhancement: Fetch project by ID from WatermelonDB
const enhance = withObservables(["id"], ({ id }: { id: string }) => ({
  project: database.get<Project>("projects").findAndObserve(id),
}));

// Wrapper to handle route params
export default function ProjectDetailsRoute() {
  const { id } = useLocalSearchParams();
  // In a real app we might want to ensure ID is a string
  const projectId = Array.isArray(id) ? id[0] : id;

  // We need a separate component for the enhanced version to pass props correctly
  const EnhancedProjectDetails = enhance(ProjectDetails);

  return <EnhancedProjectDetails id={projectId} />;
}
