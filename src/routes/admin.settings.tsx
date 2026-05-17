import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const MAP_KEY = "google_maps_api_key";

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [value, setValue] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["app_settings", MAP_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", MAP_KEY)
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? "";
    },
  });

  useEffect(() => {
    if (typeof data === "string") setValue(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (val: string) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: MAP_KEY, value: val, updated_by: user?.id ?? null },
          { onConflict: "key" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["app_settings", MAP_KEY] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage integrations and API keys.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Maps API</CardTitle>
          <CardDescription>
            Stored securely in the database. Used by the app to access Google Maps services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="map-key">API key</Label>
            <Input
              id="map-key"
              type="password"
              autoComplete="off"
              placeholder={isLoading ? "Loading…" : "Enter your Google Maps API key"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => save.mutate(value.trim())}
              disabled={save.isPending || isLoading}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
            {value && (
              <Button variant="outline" onClick={() => save.mutate("")} disabled={save.isPending}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
