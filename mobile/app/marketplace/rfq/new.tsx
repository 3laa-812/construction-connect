import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RFQNewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    Alert.alert(
      "RFQ Sent",
      "Your request has been sent to verified suppliers.",
    );
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4 border-b border-border flex-row justify-between items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-secondary-foreground">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">New RFQ</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text className="text-primary font-bold">Submit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="p-4">
        <View className="mb-4">
          <Text className="text-sm text-muted-foreground mb-1">
            Title / Reference
          </Text>
          <TextInput
            className="bg-card text-foreground p-3 rounded-lg border border-border"
            placeholder="e.g. Urgent Cement for Block C"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {params.itemId && (
          <View className="mb-4 bg-primary/10 p-3 rounded-lg border border-primary/20">
            <Text className="text-primary font-bold mb-1">
              Requested Item ID: {params.itemId}
            </Text>
            <Text className="text-xs text-muted-foreground">
              This item will be added to your RFQ automatically.
            </Text>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-sm text-muted-foreground mb-1">
            Notes to Suppliers
          </Text>
          <TextInput
            className="bg-card text-foreground p-3 rounded-lg border border-border h-32"
            placeholder="Specify delivery location, timeline, etc."
            placeholderTextColor="hsl(var(--muted-foreground))"
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
