import IngestModal from "./CollectionComponents/Ingest";
import AddLibrary from "./CollectionComponents/AddLibrary";
import DataStoreSelect from "./CollectionComponents/DataStoreSelect";
import { useState } from "react";
export function LibraryModal() {
  const [showUpload, setShowUpload] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const selectedCollection = { id: 0 };
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {showUpload && selectedCollection?.id !== 0 ? (
          <IngestModal setShowUpload={setShowUpload} />
        ) : (
          <div className="space-y-6">
            <div>
              {!showAddStore && <DataStoreSelect />}
              {showAddStore && <AddLibrary />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
