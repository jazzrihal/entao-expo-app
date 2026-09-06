import { useState } from "react";
import { TabList, TabSlot, Tabs, TabTrigger } from "expo-router/ui";
import { AppTabBar } from "@/components/app-tab-bar";
import { TabBarContext } from "@/context/tab-bar";

export default function TabsLayout() {
  const [isTabBarHidden, setIsTabBarHidden] = useState(false);

  return (
    <TabBarContext value={{ setIsTabBarHidden }}>
      <Tabs>
        <TabSlot />
        {isTabBarHidden ? null : <AppTabBar />}
        {/* Route-defining triggers must be literal TabList children of Tabs. */}
        <TabList style={{ display: "none" }}>
          <TabTrigger name="home" href="/home" />
          <TabTrigger name="friends" href="/friends" />
          <TabTrigger name="profile" href="/profile" />
        </TabList>
      </Tabs>
    </TabBarContext>
  );
}
