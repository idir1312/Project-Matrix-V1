'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import Map from '@/components/Map';
import useStore from '@/lib/store';

/*
 * Home page of the console. It renders a sidebar containing the domain tabs,
 * a year slider and a dark mode switch, plus a map occupying the rest of
 * the viewport. Changing the domain or year triggers requests to the API
 * routes and re‑renders the map layers accordingly.
 */
export default function Home() {
  const { activeDomain, setActiveDomain, selectedYear, setSelectedYear } = useStore();
  const { setTheme } = useTheme();

  return (
    <div className="flex h-screen">
      <aside className="w-64 p-4 space-y-4 border-r bg-background">
        <Tabs value={activeDomain} onValueChange={setActiveDomain}>
          <TabsList>
            <TabsTrigger value="economy">Economy</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          </TabsList>
        </Tabs>
        <div>
          <label className="block text-sm font-medium mb-2">Year</label>
          <Slider
            min={2010}
            max={2023}
            value={[selectedYear]}
            onValueChange={([val]) => setSelectedYear(val)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch onCheckedChange={(checked: boolean) => setTheme(checked ? 'dark' : 'light')} />
          <span className="text-sm">Dark Mode</span>
        </div>
        <Card className="p-2 text-sm">Detail Panel (Click map)</Card>
      </aside>
      <main className="flex-1">
        <Map />
      </main>
    </div>
  );
}