"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipProvider } from "@radix-ui/react-tooltip";
import ListFileComponent from "@/app/ListFileComponent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Dropzone from "react-dropzone";
import { FileUploader } from "./file-uploader";
import { API_ENDPOINT } from "@/app/utils/Endpoint";
import { getToken } from "@/app/utils/TokenUtils";
import { formatBytes } from "@/app/utils/StreamUtils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ViewMode = "grid" | "list";
// const progresses: Record<string, number> = {};

export function FileStorage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [path, setPath] = useState("MyDrive");

  const mainFolder = ["MyDrive", "Recent", "Shared", "Starred", "Trash"];
  const [files, setFiles] = useState<File[]>([]);

  const [username, setUsername] = useState<string>();

  const [totalUsage, setTotalUsage] = useState(0);

  const [progresses, setProgresses] = useState<Record<string, number>>({});

  const fileComponentRef = useRef<any>();

  const router = useRouter();

  const setDarkMode = (mode: boolean) => {
    localStorage.setItem("darkmode", mode.toString());
    setIsDarkMode(mode);
  };

  const setView = (mode: ViewMode) => {
    localStorage.setItem("viewmode", mode.toString());
    setViewMode(mode);
  };

  useEffect(() => {
    //* Theme saving
    let isSavedDarkMode = localStorage.getItem("darkmode");
    if (isSavedDarkMode && isSavedDarkMode == "true") {
      setIsDarkMode(true);
    }

    //* View saving
    let isSavedViewMode = localStorage.getItem("viewmode");
    if (isSavedViewMode) {
      setView(isSavedViewMode as ViewMode);
    }

    (async() => {

      if(!getToken()) {
        router.push("/login")
      }

      // Authorization myself
      const auth = await fetch(API_ENDPOINT + "auth/me", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + getToken()
        },
        cache: "no-cache"
      })

      if(!auth.ok) {
        // Session expired
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        toast.error("Your session has expired")
        window.location.reload();
      }

      const user_data = await auth.json();

      setUsername(user_data.username)

      // const user = await auth.json();

      const files: any[] = [];
      const res = await fetch(API_ENDPOINT + "file/list?recursive=true", {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + getToken()
        },
        cache: "no-cache"
        
      })

      files.push(...(await res.json()));

      let usage = 0
      for (const file of files) {
        if (file.type == "file") {
          usage += file.size
        }
      }

      setTotalUsage(usage)
    })()
  }, []);

  const createFolder = () => {
    // alert("create folder1");
    if (!fileComponentRef.current) return;
    alert("create folder");
    // fileComponentRef.current.createFolder();
  };

  function handleUpload(files: File[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      for (const file of files) {
        console.log("Uploading-----------------", file.name);
        await (() => {
          return new Promise((ress, rej) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append("file", file);
            formData.append("filePath", file.name);

            xhr.open("POST", API_ENDPOINT + "file/upload", true);
            xhr.setRequestHeader("Authorization", "Bearer " + getToken());

            // Event listener for upload progress
            xhr.upload.onprogress = function (event) {
              if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                // progresses[file.name] = percentComplete;
                setProgresses((prevProgresses) => ({
                  ...prevProgresses,
                  [file.name]: percentComplete,
                }))
                console.log(`Upload Progress: ${percentComplete.toFixed(2)}%`);
              }
            };

            // Event listener for completion
            xhr.onload = function () {
              if (xhr.status === 200) {
                // try {
                  const jsonResponse = xhr.responseText;
                  console.log("Uploaded", jsonResponse);
                  ress(true);
                // } catch (e) {
                //   reject(e);
                // }
              } else {
                reject(xhr.responseText);
              }
            };

            // Event listener for error
            xhr.onerror = function () {
              console.log("Error uploading file");
              reject(xhr.responseText);
            };

            xhr.send(formData);
          });
        })();
      }

      console.log("All files uploaded");
      resolve();
    });
  }

  return (
    <div className={`flex min-h-screen w-full ${isDarkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-20 flex h-14 w-full items-center justify-between gap-4 border-b bg-background px-4 sm:hidden border-input`}
      >
        {/* Toggle Sidebar for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full text-foreground`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Toggle navigation</span>
        </Button>
        <div className="flex items-center gap-4">
          <div className={`text-sm font-medium text-foreground`}>
            {username}
          </div>
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
            <AvatarFallback>{username}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full text-foreground`}
            onClick={() => setDarkMode(!isDarkMode)}
          >
            <SunMoonIcon className="h-5 w-5" />
            <span className="sr-only">Toggle dark mode</span>
          </Button>
        </div>
      </div>
      <div
        className={`fixed top-14 left-0 z-20 h-[calc(100vh-3.5rem)] w-full overflow-y-auto border-r bg-background shadow-lg transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } sm:static sm:z-auto sm:h-auto sm:w-auto sm:translate-x-0 sm:border-r-0 sm:bg-transparent sm:shadow-none border-input`}
      >
        <nav className="flex flex-col items-start gap-4 rounded-r-2xl px-4 py-6 sm:rounded-none sm:shadow-none h-full bg-background">
          {/* <Link
            href="#"
            className={`flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-2`}
            prefetch={false}
          >
            <HardDriveIcon className="h-5 w-5" />
            <span className="text-sm font-medium">My Drive</span>
          </Link> */}
          <div className="flex flex-col items-start gap-2 h-full">
            {mainFolder.map((folder, index) => (
              <Button
                variant="ghost"
                className={`flex w-full items-center justify-start gap-2 rounded-full px-3 py-2 text-left text-sm font-medium ${
                  path.includes(folder)
                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    : "bg-background text-primary hover:bg-muted"
                }`}
                onClick={() => setPath(folder)}
                key={index}
              >
                <FolderIcon className="h-5 w-5" />
                <span>{folder}</span>
              </Button>
            ))}

            <Button
              variant="ghost"
              className={`flex w-full mt-auto items-center justify-start gap-2 rounded-full px-3 py-2 text-left text-sm font-medium bg-background text-primary hover:bg-background cursor-default`}
            >
              <span>Usages: {formatBytes(totalUsage)}/∞</span>
            </Button>
          </div>
        </nav>
      </div>
      {/* Nav bar */}
      <div className="flex flex-1 flex-col bg-background">
        <div className="block sm:hidden mt-16"></div>
        <header
          className={`sticky top-4 z-10 h-14 items-center justify-between gap-4 bg-background px-4 sm:px-6 hidden sm:flex`}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full text-foreground`}
              onClick={() => setView(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? (
                <LayoutGridIcon className="h-5 w-5" />
              ) : (
                <ListIcon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle view</span>
            </Button>
            <div className="relative w-full max-w-md">
              <Input
                type="text"
                placeholder="Search files..."
                className={`h-8 w-full rounded-full border-2 bg-transparent px-4 pr-10 text-sm focus:outline-none border-input text-foreground`}
              />
              {/* <Button
                variant="ghost"
                size="icon"
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-opacity-0 text-foreground`}
              > */}
              <TooltipProvider>
                <SearchIcon className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-opacity-0" />
                <Tooltip>
                  <span className="sr-only">Search</span>
                </Tooltip>
              </TooltipProvider>
              {/* </Button> */}
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className={`text-sm font-medium text-foreground`}>
              {username}
            </div>
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full text-foreground`}
              onClick={() => setDarkMode(!isDarkMode)}
            >
              <SunMoonIcon className="h-5 w-5" />
              <span className="sr-only">Toggle dark mode</span>
            </Button>
          </div>
        </header>
        {/* Main content */}
        <main className="h-full">
          {path.includes("MyDrive") && username ? (
            <ListFileComponent ref={fileComponentRef} viewMode={viewMode} />
          ) : (
            <div className="flex items-center justify-center h-full text-foreground">
              <h1>Comming Soon</h1>
            </div>
          )}
        </main>
      </div>
      {/* Drop down menu */}
      <Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`fixed bottom-8 right-8 z-10 rounded-full bg-primary p-2 shadow-lg text-primary-foreground`}
            >
              <PlusIcon className="h-8 w-8" />
              <span className="sr-only">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => createFolder()}>
              <FolderIcon className="mr-2 h-4 w-4" />
              Create Folder
            </DropdownMenuItem>
            <DialogTrigger>
              <DropdownMenuItem>
                <UploadIcon className="mr-2 h-4 w-4" />
                Upload file
              </DropdownMenuItem>
            </DialogTrigger>
            {/* <DropdownMenuItem className="hidden md:flex">
              <FolderIcon className="mr-2 h-4 w-4" />
              Upload folder
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
            <DialogDescription>
              Drag and drop your files here or click to browse.
            </DialogDescription>
          </DialogHeader>
          <FileUploader
            maxFileCount={8}
            maxSize={10 * 1024 * 1024 * 1024}
            onUpload={handleUpload}
            progresses={progresses}
          />
          {/* <DialogFooter>
          <Button type="submit">Confirm</Button>
        </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DownloadIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function FolderIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function HardDriveIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" x2="2" y1="12" y2="12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      <line x1="6" x2="6.01" y1="16" y2="16" />
      <line x1="10" x2="10.01" y1="16" y2="16" />
    </svg>
  );
}

function LayoutGridIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function ListIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

function MenuIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function MoonIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function SunMoonIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.9 4.9 1.4 1.4" />
      <path d="m17.7 17.7 1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.3 17.7-1.4 1.4" />
      <path d="m19.1 4.9-1.4 1.4" />
    </svg>
  );
}

function TrashIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function UploadIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
