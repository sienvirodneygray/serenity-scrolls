"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileUp, CheckCircle2, XCircle, Loader2, AlertTriangle, Download } from "lucide-react";

interface ImportRow {
  email: string;
  first_name?: string;
  last_name?: string;
}

interface ImportResult {
  successful: number;
  skipped: number;
  errors: string[];
}

export default function ContactImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parseCsv = (text: string): ImportRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
      return {
        email: row["email"] ?? "",
        first_name: row["first_name"] || row["firstname"] || row["first name"] || "",
        last_name: row["last_name"] || row["lastname"] || row["last name"] || "",
      };
    }).filter((r) => r.email.includes("@"));
  };

  const importMutation = useMutation({
    mutationFn: async (rows: ImportRow[]) => {
      let successful = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const row of rows) {
        const { error } = await supabase
          .from("customers")
          .upsert(
            { email: row.email, first_name: row.first_name || null, last_name: row.last_name || null },
            { onConflict: "email", ignoreDuplicates: true }
          );
        if (error) {
          if (error.code === "23505") { skipped++; }
          else { errors.push(`${row.email}: ${error.message}`); }
        } else {
          successful++;
        }
      }
      return { successful, skipped, errors };
    },
    onSuccess: (data) => {
      setResult(data);
      setPreview([]);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-customer-count"] });
      toast({
        title: "Import complete",
        description: `${data.successful} contacts imported, ${data.skipped} skipped (duplicates).`,
      });
    },
    onError: () => {
      toast({ title: "Import failed", description: "Unexpected error during import.", variant: "destructive" });
    },
  });

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast({ title: "No valid rows found", description: "Make sure your CSV has an 'email' column.", variant: "destructive" });
        return;
      }
      setResult(null);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <CampaignLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Import</h1>
          <p className="text-muted-foreground mt-1">Upload a CSV to bulk-add contacts to your CRM.</p>
        </div>

        {/* CSV Format Info */}
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Required CSV Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Your CSV must have at minimum an <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">email</code> column.
              Optional columns: <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">first_name</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">last_name</code>.
            </p>
            <code className="block bg-muted rounded p-3 text-xs font-mono">
              email,first_name,last_name<br />
              jane@example.com,Jane,Doe<br />
              john@example.com,John,Smith
            </code>
          </CardContent>
        </Card>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          <FileUp className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="font-medium text-foreground">Drop your CSV here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">Accepts .csv files only</p>
        </div>

        {/* Preview Table */}
        {preview.length > 0 && !result && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Preview — {preview.length} contacts found</CardTitle>
              <CardDescription>Review before importing. Duplicates will be automatically skipped.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">First Name</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Last Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">{row.email}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.first_name || "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.last_name || "—"}</td>
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr className="border-t">
                        <td colSpan={3} className="px-4 py-2 text-muted-foreground text-center text-xs">
                          ... and {preview.length - 10} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => importMutation.mutate(preview)}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                  ) : (
                    <><FileUp className="w-4 h-4 mr-2" /> Import {preview.length} Contacts</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setPreview([])}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-2xl font-bold text-green-600">{result.successful}</p>
                  <p className="text-xs text-muted-foreground mt-1">Imported</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                  <p className="text-xs text-muted-foreground mt-1">Skipped (duplicates)</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Errors</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Errors
                  </p>
                  <ul className="space-y-1">
                    {result.errors.map((e, i) => <li key={i} className="text-xs text-red-600 dark:text-red-400 font-mono">{e}</li>)}
                  </ul>
                </div>
              )}
              <Button variant="outline" onClick={() => setResult(null)}>Import Another File</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </CampaignLayout>
  );
}
