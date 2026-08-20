"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileText, Loader2, Trash2 } from "lucide-react";

export function DocumentManager() {
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const fetchDocs = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setDocs(data);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      // 1. Upload file to Supabase Storage Bucket ('resources')
      const { error: storageError } = await supabase.storage
        .from("resources")
        .upload(filePath, file);

      if (!storageError) {
        // 2. Obtain Public URL
        const { data: publicUrlData } = supabase.storage
          .from("resources")
          .getPublicUrl(filePath);

        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";

        // 3. Insert record into user_documents table
        const { error: dbError } = await supabase
          .from("user_documents")
          .insert({
            user_id: user.id,
            name: file.name,
            file_url: publicUrlData.publicUrl,
            size: fileSizeMB,
          });

        if (!dbError) {
          fetchDocs();
        } else {
          alert(dbError.message);
        }
      } else {
        alert(storageError.message);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    await supabase.from("user_documents").delete().eq("id", id);
    fetchDocs();
  };

  return (
    <div className="space-y-4">
      <label className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-background/50 hover:bg-background transition-colors">
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <>
            <Upload className="h-6 w-6 text-primary mb-1" />
            <span className="text-xs font-semibold text-foreground">
              Upload Resource
            </span>
            <span className="text-[10px] text-muted">
              PDF, TXT, or MD up to 10MB
            </span>
          </>
        )}
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          accept=".pdf,.txt,.md"
        />
      </label>

      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
        {docs.length === 0 ? (
          <p className="text-center text-xs text-muted py-2">
            No resources uploaded.
          </p>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-xs"
            >
              <a
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 truncate hover:underline"
              >
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate text-foreground font-medium">
                  {doc.name}
                </span>
              </a>
              <button
                onClick={() => handleDelete(doc.id, doc.file_url)}
                className="text-muted hover:text-destructive transition-colors shrink-0 ml-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
