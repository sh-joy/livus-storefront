'use client';

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Megaphone, Plus, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { marqueeFormSchema } from "@/lib/validations";
import {
  fetchAdminMarqueesAction,
  createAdminMarqueeAction,
  toggleAdminMarqueeAction,
  deleteAdminMarqueeAction,
  type MarqueeItem,
} from "@/app/actions/marquee";

export default function AdminMarqueePage() {
  const [list, setList] = useState<MarqueeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [bgColor, setBgColor] = useState("#050505");
  const [textColor, setTextColor] = useState("#ffffff");
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminMarqueesAction();
      setList(data);
    } catch (err) {
      console.error("Failed to load marquees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const validation = marqueeFormSchema.safeParse({ message, linkUrl, bgColor, textColor, isActive: true });
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || "Invalid form input.");
      return;
    }

    setSaving(true);
    try {
      const res = await createAdminMarqueeAction({
        message,
        linkUrl,
        bgColor,
        textColor,
        isActive: true,
      });

      if (res.success) {
        setMessage("");
        setLinkUrl("");
        setIsOpen(false);
        await loadData();
      } else {
        setFormError(res.message || "Failed to save announcement.");
      }
    } catch (err: any) {
      setFormError(err?.message || "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      setList(list.map(item => item.id === id ? { ...item, isActive: !current } : item));
      await toggleAdminMarqueeAction(id, !current);
    } catch (err) {
      console.error("Failed to toggle:", err);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      setList(list.filter(item => item.id !== id));
      await deleteAdminMarqueeAction(id);
    } catch (err) {
      console.error("Failed to delete:", err);
      loadData();
    }
  };

  const activeBanner = list.find(item => item.isActive) || list[0];

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Marquee & Top Banner Announcements</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage scrolling marquee messages, background colors, and active promotional banners without redeploying code.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button variant="default" className="flex items-center gap-2">
              <Plus className="size-4" />
              <span>New Announcement</span>
            </Button>
          } />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Marquee Announcement</DialogTitle>
              <DialogDescription>
                Live announcements display immediately on the storefront scrolling marquee.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAdd} className="flex flex-col gap-4 py-2 font-sans">
              {formError && (
                <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Marquee Text Message *
                </label>
                <Input
                  required
                  placeholder="e.g. FREE SHIPPING ON ORDERS OVER 2500 BDT"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Click Link URL (Optional)
                </label>
                <Input
                  placeholder="/for-him or /all-products"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                    Background Color Hex
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="size-8 rounded cursor-pointer border p-0"
                    />
                    <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                    Text Color Hex
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="size-8 rounded cursor-pointer border p-0"
                    />
                    <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save Announcement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Live Preview Widget */}
      {activeBanner && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Megaphone className="size-4 text-amber-600" />
              <CardTitle className="text-sm font-semibold tracking-tight text-amber-900">
                Live Storefront Marquee Preview
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="w-full py-2.5 px-4 rounded text-center text-xs font-semibold tracking-wider uppercase overflow-hidden shadow-sm"
              style={{ backgroundColor: activeBanner.bgColor, color: activeBanner.textColor }}
            >
              {activeBanner.message}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Announcements Registry ({list.length})</CardTitle>
          <CardDescription className="text-xs">Live status toggle switches & styling from database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading announcements from database...
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No marquee announcements found. Click &quot;New Announcement&quot; to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message Text</TableHead>
                  <TableHead>Link URL</TableHead>
                  <TableHead>Theme Colors</TableHead>
                  <TableHead>Live Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground text-xs">{item.message}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{item.linkUrl || "None"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="size-4 rounded-full border shadow-sm" style={{ backgroundColor: item.bgColor }} />
                        <span className="text-xs font-mono">{item.bgColor}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleActive(item.id, item.isActive)}
                        className="flex items-center gap-1.5 cursor-pointer"
                        title="Click to toggle active status"
                      >
                        {item.isActive ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 flex items-center gap-1">
                            <CheckCircle className="size-3" />
                            <span>Active Live</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <XCircle className="size-3 text-muted-foreground" />
                            <span>Disabled</span>
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
