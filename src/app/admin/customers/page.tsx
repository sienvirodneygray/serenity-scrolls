"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, Users, Tags, FileUp } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState("directory");

  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(`
          id, email, first_name, last_name, created_at,
          customer_group_memberships (
            customer_groups ( id, name, color )
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["customer_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_groups")
        .select(`
          id, name, description, color, created_at,
          customer_group_memberships ( count )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  return (
    <CampaignLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audience CRM</h1>
            <p className="text-muted-foreground mt-1">Manage your marketing targets and segmentation rules.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/import">
                <FileUp className="w-4 h-4 mr-2" />
                Import CSV
              </Link>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Customer</DialogTitle>
                  <DialogDescription>Manually inject a single target into the system.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <FormLabel>Email Address</FormLabel>
                    <Input placeholder="user@example.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel>First Name</FormLabel>
                      <Input placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Last Name</FormLabel>
                      <Input placeholder="Doe" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Record</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Directory
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Tags className="w-4 h-4" /> Segmentation Groups
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="directory">
            <Card className="shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Segments</TableHead>
                    <TableHead>Added On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCustomers ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : customers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No customers found. Import a CSV to get started!
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers?.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary uppercase text-xs font-semibold">
                                {customer.email.charAt(0)}{customer.first_name ? customer.first_name.charAt(0) : ""}
                              </AvatarFallback>
                            </Avatar>
                            <span>{customer.first_name || ""} {customer.last_name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {customer.customer_group_memberships?.map((m: any) => (
                              <span key={m.customer_groups.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                                {m.customer_groups.name}
                              </span>
                            ))}
                            {customer.customer_group_memberships?.length === 0 && (
                              <span className="text-muted-foreground text-xs italic">Unsegmented</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            {isLoadingGroups ? (
              <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Card className="col-span-1 shadow-sm border-dashed bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer flex flex-col items-center justify-center p-6 text-center group">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Create Group</h3>
                      <p className="text-sm text-muted-foreground mt-1">Define a new segment</p>
                    </Card>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Customer Group</DialogTitle>
                      <DialogDescription>Create a segment to target specific users in your campaigns.</DialogDescription>
                    </DialogHeader>
                    {/* Add Group Form */}
                     <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <FormLabel>Group Name</FormLabel>
                          <Input placeholder="e.g., VIP Buyers" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Create Group</Button>
                      </DialogFooter>
                  </DialogContent>
                </Dialog>

                {groups?.map((group) => (
                  <Card key={group.id} className="shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-blue-500`} />
                        {group.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-3xl font-bold">{group.customer_group_memberships?.[0]?.count || 0}</p>
                          <p className="text-xs text-muted-foreground font-medium uppercase mt-1">Total Members</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CampaignLayout>
  );
}
