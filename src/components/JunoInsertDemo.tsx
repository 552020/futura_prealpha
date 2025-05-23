"use client";
import { useEffect, useState } from "react";
import { type Doc, initSatellite, setDoc } from "@junobuild/core-peer";

type Record = {
  hello: string;
};

export default function JunoInsertDemo() {
  const [record, setRecord] = useState<Doc<Record> | undefined>(undefined);

  useEffect(() => {
    (async () => {
      await initSatellite();
    })();
  }, []);

  const insert = async () => {
    const doc = await setDoc({
      collection: "demo",
      doc: {
        key: window.crypto.randomUUID(),
        data: {
          hello: "world",
        },
      },
    });
    setRecord(doc);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <button onClick={insert}>Insert a document</button>
      {record !== undefined && <span style={{ marginLeft: 8 }}>Key: {record.key}</span>}
    </div>
  );
}
