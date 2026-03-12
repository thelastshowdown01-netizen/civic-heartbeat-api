import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Upload, X, Loader2, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { categoryLabels } from "@/lib/issueHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const reportSchema = z.object({
  title: z.string().trim().max(120, "Title must be under 120 characters").optional().or(z.literal("")),
  description: z.string().trim().min(10, "Describe the issue in at least 10 characters").max(500, "Description must be under 500 characters"),
  category: z.enum(["pothole", "garbage", "sewer_overflow", "water_leakage", "street_light", "road_damage", "other"], {
    required_error: "Select a category",
  }),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  landmark: z.string().trim().max(200).optional().or(z.literal("")),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface SubmissionResult {
  action_taken: "created_new_issue" | "attached_to_existing_issue";
  issue_id: string;
  duplicate_match_reason?: string | null;
}

interface ReportFormProps {
  onSuccess: (result: SubmissionResult) => void;
}

const ReportForm = ({ onSuccess }: ReportFormProps) => {
  const { session } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { title: "", description: "", pincode: "", landmark: "" },
  });

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      form.setError("root", { message: "Image must be under 5 MB" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, [form]);

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (values: ReportFormValues) => {
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        setUploading(true);
        const ext = imageFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("issue-images").upload(path, imageFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("issue-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
        setUploading(false);
      }

      const { data, error } = await supabase.functions.invoke("submit-report", {
        body: {
          title: values.title || undefined,
          description: values.description,
          category: values.category,
          pincode: values.pincode,
          image_url: imageUrl,
          latitude: coords?.lat,
          longitude: coords?.lng,
        },
      });

      if (error) throw error;
      onSuccess(data as SubmissionResult);
    } catch (err: any) {
      form.setError("root", { message: err.message || "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {form.formState.errors.root && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. Broken street light near park" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the issue — what, where, how severe..." className="min-h-[100px] resize-none" {...field} />
              </FormControl>
              <div className="flex justify-between">
                <FormMessage />
                <span className="text-xs text-muted-foreground ml-auto">{field.value?.length || 0}/500</span>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pincode <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 560001" maxLength={6} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="landmark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Landmark / Area <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. Near City Mall, MG Road" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <div className="space-y-2">
          <Label>Location</Label>
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={getLocation} disabled={locating}>
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {coords ? "Location captured" : "Use My Location"}
          </Button>
          {coords && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </div>

        {/* Image upload */}
        <div className="space-y-2">
          <Label>Photo <span className="text-muted-foreground font-normal">(optional, max 5 MB)</span></Label>
          {imagePreview ? (
            <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
              <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
        </div>

        <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting || uploading}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploading ? "Uploading image..." : "Submitting..."}
            </>
          ) : (
            "Submit Report"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ReportForm;
