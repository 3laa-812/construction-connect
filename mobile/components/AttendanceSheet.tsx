import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

interface AttendanceData {
  [role: string]: number;
}

interface AttendanceSheetProps {
  data: AttendanceData;
  onChange: (data: AttendanceData) => void;
}

const ROLES = [
  "Site Engineer",
  "Foreman",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Helper",
  "Driver",
];

export default function AttendanceSheet({
  data,
  onChange,
}: AttendanceSheetProps) {
  const handleChange = (role: string, value: string) => {
    const num = parseInt(value, 10);
    const newData = { ...data };
    if (isNaN(num) || num === 0) {
      delete newData[role];
    } else {
      newData[role] = num;
    }
    onChange(newData);
  };

  return (
    <View className="bg-card p-4 rounded-xl border border-border mb-4">
      <Text className="text-lg font-bold text-foreground mb-4">Attendance</Text>

      <View className="flex-row flex-wrap gap-2">
        {ROLES.map((role) => (
          <View key={role} className="w-[48%] mb-2">
            <Text className="text-xs text-muted-foreground mb-1">{role}</Text>
            <TextInput
              className="bg-secondary text-foreground p-3 rounded-lg border border-border"
              placeholder="0"
              placeholderTextColor="hsl(var(--muted-foreground))"
              keyboardType="numeric"
              value={data[role]?.toString() || ""}
              onChangeText={(t) => handleChange(role, t)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
