import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ORGANOLEPTIC_MAX_CRITICISM_IMAGES } from "@/lib/organoleptic-meta";

interface Props {
  criticism: string;
  criticismImages: string[];
  readOnly: boolean;
  uploadingImages: boolean;
  loading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onCriticismChange: (value: string) => void;
  onRemoveImage: (index: number) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPickImages: () => void;
}

export function OrganolepticFormCriticismSection({
  criticism,
  criticismImages,
  readOnly,
  uploadingImages,
  loading,
  fileInputRef,
  onCriticismChange,
  onRemoveImage,
  onImageUpload,
  onPickImages,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Kritik dan Saran</label>
      <Textarea
        value={criticism}
        onChange={(e) => onCriticismChange(e.target.value)}
        disabled={readOnly}
        rows={3}
        placeholder="Kritik dan saran dari pemeriksa"
      />

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Lampiran gambar (opsional, maks. {ORGANOLEPTIC_MAX_CRITICISM_IMAGES})
        </p>

        {criticismImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {criticismImages.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative h-24 w-24 overflow-hidden rounded-xl border bg-muted/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Lampiran ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    aria-label={`Hapus gambar ${index + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!readOnly &&
          criticismImages.length < ORGANOLEPTIC_MAX_CRITICISM_IMAGES && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={onImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingImages || loading}
                onClick={onPickImages}
              >
                {uploadingImages ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-1 h-4 w-4" />
                )}
                {uploadingImages ? "Mengupload..." : "Upload Gambar"}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, atau GIF. Maks. 5MB per gambar.
              </p>
            </>
          )}
      </div>
    </div>
  );
}
