import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

interface AccessRequest {
  id: string;
  email: string;
  order_id: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export function AccessRequestsManagement() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load access requests",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: AccessRequest) => {
    setProcessingId(request.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Update request status
      const { error: updateError } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          admin_notes: notes[request.id] || null,
          reviewed_by: session?.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Send approval email
      const { error: emailError } = await supabase.functions.invoke("send-access-approval", {
        body: { email: request.email, orderId: request.order_id },
      });

      if (emailError) {
        console.error("Email error:", emailError);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Request approved but email failed to send",
        });
      } else {
        toast({
          title: "Approved!",
          description: `Access granted to ${request.email}`,
        });
      }

      loadRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve request",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (request: AccessRequest) => {
    setProcessingId(request.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "denied",
          admin_notes: notes[request.id] || null,
          reviewed_by: session?.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Denied",
        description: `Request from ${request.email} has been denied`,
      });

      loadRequests();
    } catch (error) {
      console.error("Error denying request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deny request",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "denied":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Denied</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Access Requests</h2>
          <p className="text-muted-foreground">Review and approve customer access requests</p>
        </div>
        <Button variant="outline" onClick={loadRequests}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
          <CardDescription>
            Requests awaiting your review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{request.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Order ID: <span className="font-mono">{request.order_id}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <Textarea
                    placeholder="Admin notes (optional)"
                    value={notes[request.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [request.id]: e.target.value })}
                    className="text-sm"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Send Email
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeny(request)}
                      disabled={processingId === request.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
          <CardDescription>Previously reviewed requests</CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No processed requests yet</p>
          ) : (
            <div className="space-y-2">
              {processedRequests.slice(0, 20).map((request) => (
                <div key={request.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-4">
                    {getStatusBadge(request.status)}
                    <div>
                      <p className="text-sm font-medium">{request.email}</p>
                      <p className="text-xs text-muted-foreground font-mono">{request.order_id}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {request.reviewed_at && new Date(request.reviewed_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
