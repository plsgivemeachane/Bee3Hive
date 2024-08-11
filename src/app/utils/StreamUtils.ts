import { Readable } from "stream";

/**
 * Converts a ReadableStream to a Blob.
 *
 * @param {ReadableStream} stream - The ReadableStream to convert.
 * @return {Promise<Blob>} A Promise that resolves to the resulting Blob.
 */
async function streamToBlob(stream: ReadableStream): Promise<Blob> {
  const reader = stream.getReader();
  const chunks: BlobPart[] = [];
  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    if (value) {
      chunks.push(value);
    }
    done = doneReading;
  }

  return new Blob(chunks);
}

/**
 * Converts a ReadableStream to a URL.
 *
 * @param {ReadableStream} readable - The ReadableStream to convert.
 * @return {string} A URL that can be used to access the contents of the ReadableStream.
 */
async function readableToURL(readable: ReadableStream) {
  const blob = await streamToBlob(readable);
  const url = URL.createObjectURL(blob);
  return url;
}

/**
 * Parses a file in chunks and invokes a callback for each chunk.
 * @param file - The file to parse.
 * @param callback - The callback function to invoke for each chunk.
 * @returns void
 */
function parseFile(file: File, callback: (chunk: ArrayBuffer | null, EOL: boolean) => void): void {
  const fileSize = file.size;
  const chunkSize = 64 * 1024; // bytes
  let offset = 0;

  /**
   * Handles the read event.
   * @param evt - The read event.
   * @returns void
   */
  const readEventHandler = (evt: ProgressEvent<FileReader>): void => {
    if (evt.target == null) {
      return;
    }
    if (evt.target.error == null) {
      offset += (evt.target.result as ArrayBuffer)?.byteLength ?? 0;
      console.log(formatBytes(offset));
      callback(evt.target.result as ArrayBuffer, false); // callback for handling read chunk
    } else {
      console.log("Read error: " + evt.target.error);
      return;
    }
    if (offset >= fileSize) {
      console.log("Done reading file");
      callback(null, true);
      return;
    }

    // of to the next chunk
    chunkReaderBlock(offset, chunkSize, file);
  };

  /**
   * Reads a chunk of the file.
   * @param offset - The offset of the chunk.
   * @param length - The length of the chunk.
   * @param file - The file to read.
   * @returns void
   */
  const chunkReaderBlock = (
    offset: number,
    length: number,
    file: File
  ): void => {
    const r = new FileReader();
    const blob = file.slice(offset, length + offset);
    r.onload = readEventHandler;
    r.readAsArrayBuffer(blob);
  };

  // now let's start the read with the first block
  chunkReaderBlock(offset, chunkSize, file);
}

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 Bytes";
  }
  var k = 1000;
  var sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export { readableToURL, parseFile, formatBytes};
