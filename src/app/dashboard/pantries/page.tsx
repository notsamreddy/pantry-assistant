"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PantryHoursInput, type HoursEntry } from "@/components/pantry-hours-input";

export default function PantriesPage() {
  const pantries = useQuery(api.pantries.list);
  const updatePantry = useMutation(api.pantries.update);
  const createPantry = useMutation(api.pantries.create);
  const deletePantry = useMutation(api.pantries.remove);

  const [editingPantry, setEditingPantry] = useState<{
    id: Id<"pantries">;
    name: string;
    address: string;
    phoneNumber: string;
    inventory: string;
    email?: string;
    website?: string;
    hours?: HoursEntry[];
    status: "active" | "inactive";
  } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [newPantry, setNewPantry] = useState({
    name: "",
    address: "",
    phoneNumber: "",
    inventory: "",
    email: "",
    website: "",
    hours: [] as HoursEntry[],
    status: "active" as "active" | "inactive",
  });

  const handleEdit = (pantry: any) => {
    setEditingPantry({
      id: pantry._id,
      name: pantry.name,
      address: pantry.address,
      phoneNumber: pantry.phoneNumber,
      inventory: pantry.inventory,
      email: pantry.email ?? "",
      website: pantry.website ?? "",
      hours: pantry.hours ?? [],
      status: pantry.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPantry) return;
    await updatePantry({
      id: editingPantry.id,
      name: editingPantry.name,
      address: editingPantry.address,
      phoneNumber: editingPantry.phoneNumber,
      inventory: editingPantry.inventory,
      email: editingPantry.email || undefined,
      website: editingPantry.website || undefined,
      hours: editingPantry.hours && editingPantry.hours.length > 0 ? editingPantry.hours : undefined,
      status: editingPantry.status,
    });
    setIsEditDialogOpen(false);
    setEditingPantry(null);
  };

  const handleCreate = async () => {
    await createPantry({
      name: newPantry.name,
      address: newPantry.address,
      phoneNumber: newPantry.phoneNumber,
      inventory: newPantry.inventory,
      email: newPantry.email || undefined,
      website: newPantry.website || undefined,
      hours: newPantry.hours && newPantry.hours.length > 0 ? newPantry.hours : undefined,
      status: newPantry.status,
    });
    setIsCreateDialogOpen(false);
    setNewPantry({
      name: "",
      address: "",
      phoneNumber: "",
      inventory: "",
      email: "",
      website: "",
      hours: [],
      status: "active",
    });
  };

  const handleDelete = async (id: Id<"pantries">) => {
    if (confirm("Are you sure you want to delete this pantry?")) {
      await deletePantry({ id });
    }
  };

  if (pantries === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading pantries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pantries Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage pantries in your area
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Pantry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Pantry</DialogTitle>
              <DialogDescription>
                Fill in the details for the new pantry.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newPantry.name}
                  onChange={(e) =>
                    setNewPantry({ ...newPantry, name: e.target.value })
                  }
                  placeholder="Pantry Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={newPantry.address}
                  onChange={(e) =>
                    setNewPantry({ ...newPantry, address: e.target.value })
                  }
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newPantry.phoneNumber}
                  onChange={(e) =>
                    setNewPantry({
                      ...newPantry,
                      phoneNumber: e.target.value,
                    })
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inventory">Inventory *</Label>
                <Textarea
                  id="inventory"
                  value={newPantry.inventory}
                  onChange={(e) =>
                    setNewPantry({ ...newPantry, inventory: e.target.value })
                  }
                  placeholder="Common items: Canned goods, pasta, rice, beans..."
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPantry.email}
                  onChange={(e) =>
                    setNewPantry({ ...newPantry, email: e.target.value })
                  }
                  placeholder="contact@pantry.org"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={newPantry.website}
                  onChange={(e) =>
                    setNewPantry({ ...newPantry, website: e.target.value })
                  }
                  placeholder="https://www.pantry.org"
                />
              </div>
              <PantryHoursInput
                hours={newPantry.hours}
                onChange={(hours) => setNewPantry({ ...newPantry, hours })}
              />
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newPantry.status}
                  onChange={(e) =>
                    setNewPantry({
                      ...newPantry,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !newPantry.name ||
                  !newPantry.address ||
                  !newPantry.phoneNumber ||
                  !newPantry.inventory
                }
              >
                Create Pantry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {pantries.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No pantries found. Add your first pantry to get started.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pantries.map((pantry) => (
                <TableRow key={pantry._id}>
                  <TableCell className="font-medium">{pantry.name}</TableCell>
                  <TableCell>{pantry.address}</TableCell>
                  <TableCell>{pantry.phoneNumber}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={pantry.inventory}>
                      {pantry.inventory}
                    </div>
                  </TableCell>
                  <TableCell>{pantry.email || "-"}</TableCell>
                  <TableCell>
                    {pantry.website ? (
                      <a
                        href={pantry.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {pantry.hours && pantry.hours.length > 0 ? (
                      <div className="space-y-1">
                        {pantry.hours.map((h, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{h.day}:</span>{" "}
                            {h.time || "No time specified"}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        pantry.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {pantry.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(pantry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pantry._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pantry</DialogTitle>
            <DialogDescription>
              Update the pantry information below.
            </DialogDescription>
          </DialogHeader>
          {editingPantry && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editingPantry.name}
                  onChange={(e) =>
                    setEditingPantry({ ...editingPantry, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Input
                  id="edit-address"
                  value={editingPantry.address}
                  onChange={(e) =>
                    setEditingPantry({
                      ...editingPantry,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  value={editingPantry.phoneNumber}
                  onChange={(e) =>
                    setEditingPantry({
                      ...editingPantry,
                      phoneNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-inventory">Inventory *</Label>
                <Textarea
                  id="edit-inventory"
                  value={editingPantry.inventory}
                  onChange={(e) =>
                    setEditingPantry({
                      ...editingPantry,
                      inventory: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingPantry.email}
                  onChange={(e) =>
                    setEditingPantry({
                      ...editingPantry,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  type="url"
                  value={editingPantry.website}
                  onChange={(e) =>
                    setEditingPantry({
                      ...editingPantry,
                      website: e.target.value,
                    })
                  }
                />
              </div>
              {editingPantry.hours !== undefined && (
                <PantryHoursInput
                  hours={editingPantry.hours}
                  onChange={(hours) =>
                    setEditingPantry({ ...editingPantry, hours })
                  }
                />
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editingPantry.status}
                  onChange={(e) =>
                    setEditingPantry({
                      ...editingPantry,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={
                !editingPantry?.name ||
                !editingPantry?.address ||
                !editingPantry?.phoneNumber ||
                !editingPantry?.inventory
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

