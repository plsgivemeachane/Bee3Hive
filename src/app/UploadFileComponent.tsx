"use client";
import { useEffect, useRef, useState } from "react";
import { Readable } from "stream";
import { parseFile } from "./utils/StreamUtils";
import { createRepo, whoAmI, uploadFilesWithProgress, listFiles, fileExists } from "@huggingface/hub";
import type { RepoDesignation, Credentials } from "@huggingface/hub";
import ProgressBar from "./ProgessBar";
import { assert } from "console";

export default function UploadFileComponent(probs: { 
  credentials: Credentials,
  repo: RepoDesignation,
  username: string
}) {
  const [files, setFiles] = useState<FileList>();

  const [huggingfaceUsername, setHuggingfaceUsername] = useState<string>();
  const [hugginUploadState, setHugginUploadState] = useState<string>();
  const [hugginFileState, setHugginFileState] = useState<number>(0);
  const [hugginFileUploadState, setHugginFileUploadState] = useState<string>();
  const progressBarRef = useRef<any>();

  useEffect(() => {
    (async () => {
      try {
        const repo: RepoDesignation = {
          type: "dataset",
          name: "quanvndzai/" + probs.username,
        };
        await createRepo({
          repo,
          credentials: probs.credentials,
          private: true,
        });
      } catch (e) {
        // Fail to create repo
        console.log(e);
      }


      
    })();
  }, []);

  const handleFileChange = (event: any) => {
    setFiles(event.target.files);
  };

  const handleUploadFile = async (file: File) => {
    const fileInfo = await fileExists({
      repo: probs.repo,
      credentials: probs.credentials,
      path: "lol/" + file.name
    });

    if(fileInfo) {
      if(!confirm("File already exists. Overwrite?")) return;
    }

    for await (const progressEvent of await uploadFilesWithProgress({
      repo: probs.repo,
      credentials: probs.credentials,
      files: [
        {
          path: "lol/" + file.name,
          content: file,
        },
      ],
      useWebWorkers: true
    })) {
      console.log(progressEvent);
      setHugginUploadState(progressEvent.event);
      if (progressEvent.event == "fileProgress") {
        setHugginFileState(Math.floor(progressEvent.progress * 100));
        setHugginFileUploadState(progressEvent.state);
      }
    }
  };

  const test = async () => {
    const file = files?.item(0);
    if (!file) {
      alert("Did you forget to add file(s)?");
      return;
    };
    handleUploadFile(file);
  };

  return (
    <div>
      <div>
        <input type="file" multiple onChange={handleFileChange} />
        <button onClick={test}>Do stuff</button>
        {hugginUploadState == "fileProgress" ? (
          <div>
            <div className="mb-1 text-base font-medium text-green-700">
              {hugginFileUploadState}
            </div>
            <ProgressBar progress={hugginFileState}/>
          </div>
        ) : (
          <div>
            <div className="mb-1 text-base font-medium text-yellow-700">
              {hugginFileUploadState}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
