"use client";
import { useEffect, useRef, useState } from "react";
import { Readable } from "stream";
import { parseFile } from "./utils/StreamUtils";
import { createRepo, whoAmI, uploadFilesWithProgress, listFiles, fileExists } from "@huggingface/hub";
import type { RepoDesignation, Credentials } from "@huggingface/hub";
import ProgressBar from "./ProgessBar";
import { assert } from "console";
import UploadFileComponent from "./UploadFileComponent";
import ListFileComponent from "./ListFileComponent";
import { FileStorage } from "@/components/component/FileStorage";


export default function Home() {

  return (
    <div>
        <FileStorage />
    </div>
  );
}
