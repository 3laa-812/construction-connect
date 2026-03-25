import DailyLogIndexScreen from "../daily-log/index";
import { useEnsureTodayDraft } from "../../hooks/useEnsureTodayDraft";

export default function TodayTab() {
  useEnsureTodayDraft();
  return <DailyLogIndexScreen />;
}
