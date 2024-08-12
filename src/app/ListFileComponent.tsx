"use client";
import { Card } from "@/components/ui/card";
import {
  DownloadIcon,
  TrashIcon,
  FileIcon,
  FolderIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "util";
import { formatBytes } from "./utils/StreamUtils";
import { SkeletonCard } from "../components/component/SkeletonCard";
import { motion } from "framer-motion";
import { lockfilePatchPromise } from "next/dist/build/swc";
import { useRouter } from 'next/navigation'
import { API_ENDPOINT } from "./utils/Endpoint";
import { getToken } from "./utils/TokenUtils";
import { ScrollArea } from "@/components/ui/scroll-area"
import { isFileWithPreview } from "@/components/component/file-uploader";
import { toast } from "sonner";

interface HUGGINGFACE_FILES {
  type: "file" | "directory" | "unknown"
  path: string,
  oid: string | null,
  size: number | null,
  lfs: {
    oid: string,
    size: number,
    pointerSize: number
  } | null
}

interface HUGGINGFACE_DOWNLOAD_INFO {
  etag: string,
  size: number,
  downloadLink: string
}

function getFilename(filepath: string) {
  return (filepath.split("/").pop()) || "";
}

export default function ListFileComponent(probs: {
  viewMode: "grid" | "list";
  ref: any;
}) {
  const [fileEntries, setFiles] = useState<HUGGINGFACE_FILES[]>();
  const [path, setPath] = useState<string[]>([]);
  const [shouldRender, setShouldRender] = useState(true);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      setShouldRender(false);
      const files: any[] = [];
      const res = await fetch(API_ENDPOINT + "file/list" + (path.length == 0 ? "" : "?path=" + encodeURI(path.join("/"))), {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + getToken()
        },
        cache: "no-cache"
      })

      const raw_files = (await res.json()) as HUGGINGFACE_FILES[];

      // const newFiles = raw_files.map((file: HUGGINGFACE_FILES) =>
      //   Object.assign(file, {
      //     preview: URL.createObjectURL(file),
      //   })
      // );

      files.push(...raw_files);
      setFiles(files.filter((file) => !getFilename(file.path).startsWith(".")));
      setShouldRender(true);
    })();
  }, [path]);

  function DownloadFile(downloadLink: string, filename: string) {
    const a = document.createElement("a");
    a.href = downloadLink;
    a.target = "_blank";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download successfull", {
      description: `Downloaded ${downloadLink} to ${filename}`,
    });
  }

  return (
    <div ref={probs.ref}>
      <div className="flex gap-2 p-2 mb-4 items-center text-primary bg-none mt-4 ml-4">
        <FolderIcon className="h-5 w-5" />
        <Button
          variant="secondary"
          className="text-lg hover:bg-primary hover:text-primary-foreground rounded-full ml-2"
          onClick={() => setPath([])}
        >
          My Drive
        </Button>
        {path.length != 0 &&
          path.map((p, i) => (
            <div key={i} className="flex items-center">
              <ChevronRightIcon />
              <Button
                variant="secondary"
                className="text-lg hover:bg-primary hover:text-primary-foreground rounded-full ml-2"
                onClick={() => setPath(path)}
              >
                {p}
              </Button>
            </div>
          ))}
      </div>
      <ScrollArea
        className={`max-h-[calc(100vh-200px)] flex-1 p-4 sm:p-6 m-4 rounded-md bg-muted ${
          probs.viewMode === "grid"
            ? "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            : "flex flex-col gap-2"
        }`}
      >
        {fileEntries && shouldRender ? (
          fileEntries?.map((file: HUGGINGFACE_FILES, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: "10vh" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "-10vh" }}
            >
              <Card
                key={i}
                className={`group relative overflow-hidden shadow-sm transition-all hover:shadow-md bg-background text-foreground hover:bg-muted`}
                onClick={() => {
                  if (file.type == "file") return;
                  // alert
                  setPath([...path, file.path]);
                }}
              >
                {file.type == "file" && (
                  <div
                    className={`absolute inset-0 z-10 flex items-center justify-evenly bg-black/50 opacity-0 transition-opacity group-hover:backdrop-blur-sm group-hover:opacity-100`}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-full bg-primary text-muted dark:text-muted hover:bg-secondary hover:text-secondary-foreground`}
                      onClick={async () => {
                        const res = await fetch(API_ENDPOINT + "file/getdownloadurl", {
                          method: "POST",
                          headers: {
                            "Authorization": "Bearer " + getToken(),
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            path: file.path
                          }),
                          cache: "no-cache"
                        })

                        if(!res.ok) {
                          toast.error("Error on downloading file", {
                            description: await res.text()
                          })
                          return;
                        }

                        const downloadURL: HUGGINGFACE_DOWNLOAD_INFO = await res.json();
                        DownloadFile(downloadURL.downloadLink, getFilename(file.path));
                      }}
                    >
                      <DownloadIcon className="h-5 w-5" />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-full bg-primary text-muted dark:text-muted hover:bg-destructive hover:text-destructive-foreground`}
                      onClick={async () => {

                        if(!confirm("Are you sure you want to permanently delete this file?")) {
                          return;
                        }
                        
                        const res = await fetch(API_ENDPOINT + "file/delete", {
                          method: "POST",
                          headers: {
                            "Authorization": "Bearer " + getToken(),
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            filePath: file.path
                          }),
                          cache: "no-cache"
                        })

                        if(!res.ok) {
                          toast.error("Error on deleting file", {
                            description: await res.text()
                          })
                        } else {
                          toast.success("File deleted")
                        }
                      }}
                    >
                      <TrashIcon className="h-5 w-5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                )}
                <div
                  className={` cursor-pointer ${
                    probs.viewMode === "list"
                      ? "flex items-center justify-between p-8"
                      : "p-4"
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    {file.type == "directory" ? <FolderIcon /> : <FileIcon />}
                    <div className="line-clamp-1 text-md font-medium font-mono">
                      {getFilename(file.path)}
                    </div>
                  </div>
                  <div
                    className={`text-xs text-muted-foreground ${
                      file.type == "directory" ? "hidden" : ""
                    }`}
                  >
                    {formatBytes(file.size??0)}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div
            className={`${
              probs.viewMode === "list" ? "flex flex-col gap-4" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-48"
            }`}
          >
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} list={probs.viewMode === "list"} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
