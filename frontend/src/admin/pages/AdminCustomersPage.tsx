import { useState } from "react";
import { Search, Eye, Ban, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchAdminCustomers, updateCustomerStatus, type AdminCustomer } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const { toast } = useToast();
  const customersQuery = useQuery({ queryKey: ["admin-customers"], queryFn: fetchAdminCustomers, refetchInterval: 15000 });
  const customers = customersQuery.data ?? [];
  const queryClient = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: ({ email, status }: { email: string; status: "active" | "blocked" }) => updateCustomerStatus(email, status),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast({ title: customer.status === "blocked" ? "Customer blocked" : "Customer unblocked" });
    },
    onError: (error: Error) => toast({ title: "Could not update customer", description: error.message, variant: "destructive" }),
  });

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground text-sm">{customers.length} customers</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.email}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                  <TableCell>{c.totalOrders}</TableCell>
                  <TableCell>₹{c.totalSpent.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.status === "active" ? "border-badge-new/30 text-badge-new" : "border-destructive/30 text-destructive"}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(c)}><Eye className="h-3.5 w-3.5" /></Button>
                    {c.status === "blocked" ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-badge-new" title="Unblock customer" aria-label={`Unblock ${c.name}`}
                        disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ email: c.email, status: "active" })}>
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Block customer" aria-label={`Block ${c.name}`}
                        disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ email: c.email, status: "blocked" })}>
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{selected.email}</p></div>
                <div><span className="text-muted-foreground">Phone:</span><p className="font-medium">{selected.phone}</p></div>
                <div><span className="text-muted-foreground">Joined:</span><p className="font-medium">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "—"}</p></div>
                <div><span className="text-muted-foreground">Total Spent:</span><p className="font-medium">₹{selected.totalSpent.toLocaleString()}</p></div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Orders</h4>
                <p className="text-sm text-muted-foreground">{selected.totalOrders} orders totaling ₹{selected.totalSpent.toLocaleString()}.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
